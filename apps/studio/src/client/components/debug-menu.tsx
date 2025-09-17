import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { Label } from "@/client/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/client/components/ui/sheet";
import { Textarea } from "@/client/components/ui/textarea";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import {
  BarChart,
  Bug,
  Database,
  EyeOff,
  Route as RouteIcon,
} from "lucide-react";
import { posthog } from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { InternalLink } from "./internal-link";

function nullishToUndefined<T>(val: null | T): T | undefined {
  return val ?? undefined;
}

const ToolbarParamsSchema = z.object({
  actionId: z.number().nullish().transform(nullishToUndefined),
  dataAttributes: z.array(z.string()).nullish().transform(nullishToUndefined),
  distinctId: z.string().nullish().transform(nullishToUndefined),
  featureFlags: z
    .record(z.string(), z.boolean())
    .nullish()
    .transform(nullishToUndefined),
  instrument: z.boolean().nullish().transform(nullishToUndefined),
  source: z.any().nullish().transform(nullishToUndefined),
  temporaryToken: z.string(),
  token: z.string(),
  toolbarVersion: z.any().nullish().transform(nullishToUndefined),
  userEmail: z.string().nullish().transform(nullishToUndefined),
  userIntent: z.any().nullish().transform(nullishToUndefined),
});

interface ValidationResult {
  error?: string;
  isValid: boolean;
  parsedData?: z.output<typeof ToolbarParamsSchema>;
}

export function DebugMenu() {
  const [routerPanelIsOpen, setRouterPanelIsOpen] = useState(false);
  const [queryPanelIsOpen, setQueryPanelIsOpen] = useState(false);
  const [analyticsDialogIsOpen, setAnalyticsDialogIsOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const [toolbarCode, setToolbarCode] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: false,
  });

  const validateToolbarCode = (code: string): ValidationResult => {
    if (!code.trim()) {
      return { error: "Toolbar code is required", isValid: false };
    }

    try {
      let toolbarJSON: null | string = null;
      let json: unknown;

      if (code.startsWith("http://") || code.startsWith("https://")) {
        try {
          const url = new URL(code);
          // Parse the hash portion for __posthog parameter
          if (url.hash) {
            const hashParams = new URLSearchParams(url.hash.slice(1));
            toolbarJSON = hashParams.get("__posthog");
            if (toolbarJSON) {
              json = JSON.parse(toolbarJSON);
            } else {
              return {
                error: "URL missing __posthog parameter in hash",
                isValid: false,
              };
            }
          } else {
            return { error: "URL missing hash parameters", isValid: false };
          }
        } catch {
          return { error: "Invalid URL format", isValid: false };
        }
      } else if (code.includes("window.posthog.loadToolbar")) {
        // Handle raw JavaScript code by extracting the config object
        const regex = /window\.posthog\.loadToolbar\((\{.*\})\)/s;
        const match = regex.exec(code);
        if (match?.[1]) {
          const configString = match[1];
          try {
            json = JSON.parse(configString);
          } catch {
            return { error: "Invalid JSON in JavaScript code", isValid: false };
          }
        } else {
          return {
            error: "Could not extract config from JavaScript code",
            isValid: false,
          };
        }
      } else {
        // Try to parse as direct JSON
        try {
          json = JSON.parse(code);
        } catch {
          return {
            error: "Invalid format: must be URL, JavaScript code, or JSON",
            isValid: false,
          };
        }
      }

      // Validate the parsed JSON with the schema
      const result = ToolbarParamsSchema.safeParse(json);
      if (!result.success) {
        const errorMessage = z.prettifyError(result.error);
        return {
          error: `Invalid toolbar parameters: ${errorMessage}`,
          isValid: false,
        };
      }

      return { isValid: true, parsedData: result.data };
    } catch {
      return { error: "Failed to parse toolbar code", isValid: false };
    }
  };

  const handleLoadToolbar = () => {
    if (!validationResult.isValid || !validationResult.parsedData) {
      toast.error("Please fix validation errors before loading toolbar");
      return;
    }

    posthog.loadToolbar(validationResult.parsedData);
    setAnalyticsDialogIsOpen(false);
    setToolbarCode("");
    setValidationResult({ isValid: false });
  };

  if (!menuVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="rounded-full shadow-lg"
              size="icon"
              title="Debug Tools"
              variant="warning"
            >
              <Bug className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem asChild>
              <InternalLink className="cursor-pointer" to="/debug">
                <Bug className="size-4" />
                Debug Page
              </InternalLink>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setRouterPanelIsOpen(true);
              }}
            >
              <RouteIcon className="size-4" />
              Router DevTools
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setQueryPanelIsOpen(true);
              }}
            >
              <Database className="size-4" />
              Query DevTools
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setAnalyticsDialogIsOpen(true);
              }}
            >
              <BarChart className="size-4" />
              Analytics Toolbar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setMenuVisible(false);
                toast.success("Debug menu hidden!");
              }}
            >
              <EyeOff className="size-4" />
              Hide Debug Menu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet onOpenChange={setRouterPanelIsOpen} open={routerPanelIsOpen}>
        <SheetContent className="h-1/2 p-0" side="bottom">
          <SheetTitle className="sr-only">React Router Devtools</SheetTitle>
          <div className="h-full overflow-hidden text-xs">
            <TanStackRouterDevtoolsPanel
              className="h-full"
              setIsOpen={setRouterPanelIsOpen}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet onOpenChange={setQueryPanelIsOpen} open={queryPanelIsOpen}>
        <SheetContent className="h-1/2 p-0" side="bottom">
          <SheetTitle className="sr-only">React Query Devtools</SheetTitle>
          <div className="h-full overflow-hidden text-xs">
            <ReactQueryDevtoolsPanel
              onClose={() => {
                setQueryPanelIsOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        onOpenChange={setAnalyticsDialogIsOpen}
        open={analyticsDialogIsOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load PostHog Analytics Toolbar</DialogTitle>
            <DialogDescription>
              Enter the PostHog toolbar code, JavaScript snippet, or URL search
              params containing the __posthog parameter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="toolbar-code">Toolbar Code</Label>
              <Textarea
                className="min-h-24"
                id="toolbar-code"
                onChange={(e) => {
                  const value = e.target.value;
                  setToolbarCode(value);
                  setValidationResult(validateToolbarCode(value));
                }}
                placeholder="Enter PostHog toolbar code, JavaScript snippet, or URL here..."
                value={toolbarCode}
              />
              {!validationResult.isValid &&
                validationResult.error &&
                toolbarCode.trim() && (
                  <div className="text-sm text-destructive">
                    {validationResult.error}
                  </div>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setAnalyticsDialogIsOpen(false);
                setToolbarCode("");
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!validationResult.isValid}
              onClick={handleLoadToolbar}
            >
              Load Toolbar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
