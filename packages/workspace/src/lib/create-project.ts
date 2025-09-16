import { errAsync, ok, ResultAsync, safeTry } from "neverthrow";
import fs from "node:fs/promises";

import { DEFAULT_TEMPLATE_NAME, REGISTRY_TEMPLATES_FOLDER } from "../constants";
import { absolutePathJoin } from "../lib/absolute-path-join";
import { type AppConfigProject } from "../lib/app-config/types";
import { templateExists } from "../lib/app-dir-utils";
import { copyTemplate } from "../lib/copy-template";
import { TypedError } from "../lib/errors";
import { git } from "../lib/git";
import { GitCommands } from "../lib/git/commands";
import { type WorkspaceConfig } from "../types";

interface CreateProjectOptions {
  projectConfig: AppConfigProject;
  workspaceConfig: WorkspaceConfig;
}

export async function createProject(
  { projectConfig, workspaceConfig }: CreateProjectOptions,
  { signal }: { signal?: AbortSignal },
) {
  return safeTry(async function* () {
    // Ensure no folder exists
    const exists = await fs
      .access(projectConfig.appDir)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      return errAsync(
        new TypedError.Conflict(
          `Project directory already exists: ${projectConfig.appDir}`,
        ),
      );
    }
    yield* ResultAsync.fromPromise(
      fs.mkdir(projectConfig.appDir, { recursive: true }),
      (error) =>
        new TypedError.FileSystem(
          error instanceof Error ? error.message : "Unknown error",
          { cause: error },
        ),
    );

    const templateDir = absolutePathJoin(
      workspaceConfig.registryDir,
      REGISTRY_TEMPLATES_FOLDER,
      DEFAULT_TEMPLATE_NAME,
    );

    const doesTemplateExist = await templateExists({
      folderName: DEFAULT_TEMPLATE_NAME,
      workspaceConfig,
    });

    if (!doesTemplateExist) {
      return errAsync(
        new TypedError.NotFound(
          `Template does not exist: ${DEFAULT_TEMPLATE_NAME}`,
        ),
      );
    }

    yield* copyTemplate({ targetDir: projectConfig.appDir, templateDir });

    yield* git(GitCommands.init(), projectConfig.appDir, { signal });
    yield* git(GitCommands.addAll(), projectConfig.appDir, { signal });
    yield* git(
      GitCommands.commitWithAuthor(
        `Project created from ${DEFAULT_TEMPLATE_NAME} template`,
      ),
      projectConfig.appDir,
      { signal },
    );

    return ok({ projectConfig });
  });
}
