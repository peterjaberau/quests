import { type WorkspaceAppProject } from "@quests/workspace/client";
import { useQuery } from "@tanstack/react-query";
import { sort } from "radashi";

import { rpcClient } from "../rpc/client";
import { InternalLink } from "./internal-link";

interface ChatZeroStateProps {
  message?: string;
  project: WorkspaceAppProject;
  selectedSessionId?: string;
}

export function ChatZeroState({
  project,
  selectedSessionId,
}: ChatZeroStateProps) {
  const { data: allSessions = [] } = useQuery(
    rpcClient.workspace.session.live.list.experimental_liveOptions({
      input: { subdomain: project.subdomain },
    }),
  );

  const recentOtherSessions = sort(
    allSessions.filter((session) => session.id !== selectedSessionId),
    (s) => s.createdAt.getTime(),
    true,
  ).slice(0, 10);

  return (
    <div className="flex justify-center mt-8">
      <div className="text-center space-y-8">
        <div className="text-muted-foreground/50">No messages yet</div>
        {recentOtherSessions.length > 0 && (
          <div className="space-y-3 opacity-50 text-xs">
            <div>Looking for an old chat?</div>
            <div className="space-y-2">
              {recentOtherSessions.map((session) => (
                <InternalLink
                  allowOpenNewTab={false}
                  className="block underline text-xs hover:text-foreground"
                  key={session.id}
                  params={{ subdomain: project.subdomain }}
                  replace
                  search={(prev) => ({
                    ...prev,
                    selectedSessionId: session.id,
                  })}
                  to="/projects/$subdomain"
                >
                  {session.title || "Untitled Chat"}
                </InternalLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
