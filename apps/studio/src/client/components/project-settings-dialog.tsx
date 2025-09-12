import { AppIcon } from "@/client/components/app-icon";
import { cn } from "@/client/lib/utils";
import { rpcClient } from "@/client/rpc/client";
import {
  DEFAULT_THEME_GRADIENT,
  ICON_DEFAULT,
  type IconName,
  SELECTABLE_APP_ICONS,
  THEMES,
} from "@quests/shared/icons";
import { type ProjectSubdomain } from "@quests/workspace/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { IconMap } from "./app-icons";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface ProjectSettingsDialogProps {
  dialogTitle: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  subdomain: ProjectSubdomain;
}

export function ProjectSettingsDialog({
  dialogTitle,
  onOpenChange,
  open,
  subdomain,
}: ProjectSettingsDialogProps) {
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<null | string>(null);
  const [icon, setIcon] = useState<IconName>(ICON_DEFAULT);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const { isPending: isLoadingRandomTheme, mutateAsync: randomTheme } =
    useMutation(rpcClient.icon.randomTheme.mutationOptions());

  const {
    isPending: isLoadingUpdateQuestConfig,
    mutateAsync: updateQuestConfig,
  } = useMutation(
    rpcClient.workspace.project.questConfig.update.mutationOptions(),
  );

  const {
    data: questConfig,
    isLoading: isLoadingQuestConfig,
    refetch: refetchQuestConfig,
  } = useQuery(
    rpcClient.workspace.project.questConfig.bySubdomain.queryOptions({
      input: { subdomain },
    }),
  );

  useEffect(() => {
    if (open) {
      void refetchQuestConfig();
    }
  }, [open, refetchQuestConfig]);
  useEffect(() => {
    if (!open) {
      return;
    }

    if (questConfig?.icon?.lucide) {
      setIcon(questConfig.icon.lucide);
    }
    if (questConfig?.icon?.background) {
      setTheme(questConfig.icon.background);
    } else if (!theme) {
      void randomTheme({}).then((result) => {
        setTheme(result.theme);
      });
    }
    if (questConfig?.name) {
      setTitle(questConfig.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questConfig, open]);

  const handleSave = async () => {
    await updateQuestConfig({
      description: questConfig?.description,
      icon: {
        background: theme ?? DEFAULT_THEME_GRADIENT,
        lucide: icon,
      },
      name: title,
      subdomain,
    });
    onOpenChange(false);
  };

  const IconComponent = IconMap[icon];
  const isLoading =
    isLoadingRandomTheme || isLoadingUpdateQuestConfig || isLoadingQuestConfig;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) {
      return;
    }

    await handleSave();
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 pt-4 pb-8">
            <div className="flex gap-6 items-center">
              <div className="flex flex-col items-center gap-2 min-w-fit pt-2">
                <AppIcon background={theme ?? undefined} icon={icon} />
              </div>

              <div className="flex-1 grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    disabled={isLoading}
                    id="title"
                    onChange={(e) => {
                      setTitle(e.target.value);
                    }}
                    placeholder="Enter project title..."
                    value={title}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Popover
                      onOpenChange={setIconPickerOpen}
                      open={iconPickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          aria-expanded={iconPickerOpen}
                          className="justify-between flex-1"
                          disabled={isLoading}
                          role="combobox"
                          type="button"
                          variant="outline"
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-80 p-0"
                        onWheel={(e) => {
                          // Fixes scrolling on the popover content
                          e.stopPropagation();
                        }}
                      >
                        <Command>
                          <div className="flex flex-1 items-center border-b">
                            <CommandInput
                              className="flex-1 border-0 outline-none focus:ring-0"
                              containerClassName="border-0 flex-1"
                              placeholder="Search icons..."
                            />
                          </div>
                          <CommandList>
                            <CommandEmpty>No icons found.</CommandEmpty>
                            <CommandGroup>
                              <div className="grid grid-cols-6 gap-2 p-2">
                                {SELECTABLE_APP_ICONS.map((iconOption) => {
                                  const IconOption = IconMap[iconOption];
                                  return (
                                    <CommandItem
                                      className={cn(
                                        "w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center cursor-pointer p-0",
                                        icon === iconOption
                                          ? "border-foreground ring-2 ring-ring bg-accent"
                                          : "border-muted hover:border-foreground",
                                      )}
                                      key={iconOption}
                                      onSelect={() => {
                                        setIcon(iconOption);
                                        setIconPickerOpen(false);
                                      }}
                                      value={iconOption}
                                    >
                                      <IconOption className="h-5 w-5" />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="color">Color</Label>
                    <Popover
                      onOpenChange={setColorPickerOpen}
                      open={colorPickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          aria-expanded={colorPickerOpen}
                          className="justify-between"
                          disabled={isLoading}
                          role="combobox"
                          type="button"
                          variant="outline"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                background: theme ?? DEFAULT_THEME_GRADIENT,
                              }}
                            />
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-3 w-fit">
                        <div className="grid grid-cols-4 gap-2">
                          {THEMES.map((themeOption) => (
                            <button
                              className={cn(
                                "w-8 h-8 rounded-lg border-2 transition-all hover:scale-105",
                                theme === themeOption
                                  ? "border-foreground ring-2 ring-ring"
                                  : "border-muted hover:border-foreground",
                              )}
                              key={themeOption}
                              onClick={() => {
                                setTheme(themeOption);
                                setColorPickerOpen(false);
                              }}
                              style={{
                                background: themeOption,
                              }}
                              type="button"
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                onOpenChange(false);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isLoading || !title.trim()} type="submit">
              <SaveIcon className="h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
