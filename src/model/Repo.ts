import _debug from "debug";
import type { PackageJson } from "type-fest";
import type { RepoModel } from "./RepoModel";

const debug = _debug("app:model:repo");

export class Repo {
  id: number | null = null;
  name: string;
  version: string;
  changelogText: string;
  lastUpdatedAt: string = new Date().toISOString();
  createdAt: string = new Date().toISOString();

  constructor({
    name,
    version,
    changelogText,
    lastUpdatedAt = new Date().toISOString(),
    createdAt = new Date().toISOString(),
  }: {
    name: string;
    version: string;
    changelogText: string;
    lastUpdatedAt?: string;
    createdAt?: string;
  }) {
    this.name = name;
    this.version = version;
    this.changelogText = changelogText;
    this.lastUpdatedAt = lastUpdatedAt;
    this.createdAt = createdAt;
  }

  isInDb(): boolean {
    return this.id !== null;
  }

  static fromDb(repo: Repo | null): Repo | undefined {
    if (repo === null) {
      return undefined;
    }
    const { id, name, version, changelogText, lastUpdatedAt, createdAt } = repo;
    const newRepo = new Repo({
      name,
      version,
      changelogText,
      lastUpdatedAt: lastUpdatedAt as string,
      createdAt: createdAt as string,
    });
    newRepo.id = id;
    return newRepo;
  }

  static async fromCdn(
    name: string,
    repoModel: RepoModel,
    force?: boolean,
  ): Promise<Repo> {
    // get current version from cdn
    const packageJsonUrl = `https://cdn.jsdelivr.net/npm/${name}/package.json`;
    debug(`Fetching ${packageJsonUrl}`);
    const cdnResponse = await fetch(packageJsonUrl);
    const packageJson = (await cdnResponse.json()) as PackageJson;
    const { version, repository } = packageJson;
    debug(`Package version: ${version}`);
    if (version === undefined) {
      throw new Error("Version is undefined");
    }

    let existingRepo = undefined;
    if (force === undefined || force === false) {
      // check if repo exists in db and if it is up to date
      existingRepo = repoModel.getRepoByName(name);
      if (existingRepo !== undefined && existingRepo.version === version) {
        debug(`Repo ${name} is up to date`);
        return existingRepo;
      }
    }

    // fetch new changelog from cdn
    let changelogText = "";
    const changelogUrl = `https://cdn.jsdelivr.net/npm/${name}@${version}/CHANGELOG.md`;
    debug(`Fetching ${changelogUrl}`);
    const changelogResponse = await fetch(changelogUrl);
    changelogText = await changelogResponse.text();
    if (changelogResponse.status === 404) {
      debug(
        "Changelog not released on NPM. Trying to fetch changelog from git repo...",
      );
      const repoUrl =
        typeof repository === "string" ? repository : repository?.url;
      if (repoUrl === undefined) {
        debug("Repo url not found");
        throw new Error("Repo URL not found");
      }
      const repoAuthorAndNameRegex = /github\.com\/(\w*?)\/([\w-]*)(?:\.git)?/;
      const repoAuthorAndName = repoUrl.match(repoAuthorAndNameRegex);
      if (repoAuthorAndName === null) {
        debug("Repo author and name not found");
        throw new Error("Repo author and name not found");
      }
      const [, repoAuthor, repoName] = repoAuthorAndName;
      const repoChangelogUrl = `https://raw.githubusercontent.com/${repoAuthor}/${repoName}/v${version}/CHANGELOG.md`;
      debug(`Fetching ${repoChangelogUrl}`);
      const repoChangelogResponse = await fetch(repoChangelogUrl);
      if (repoChangelogResponse.status === 404) {
        debug("Changelog not found in git repo");
        throw new Error("Changelog not found in git repo");
      }
      changelogText = await repoChangelogResponse.text();
    }

    // update or create repo
    if (existingRepo !== undefined) {
      debug(
        `Updating repo ${name} from v${existingRepo.version} to v${version}`,
      );
      existingRepo.version = version;
      existingRepo.changelogText = changelogText;
      existingRepo.lastUpdatedAt = new Date().toISOString();
      repoModel.updateRepo(existingRepo);
      return existingRepo;
    }
    return new Repo({
      name,
      version,
      changelogText,
    });
  }
}
