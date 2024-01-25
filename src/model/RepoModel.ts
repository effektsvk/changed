import { db } from "@/api/db";
import { Repo } from "@/model/Repo";
import _debug from "debug";

const debug = _debug("app:model:repoModel");

export class RepoModel {
  private db: typeof db;
  constructor(_db: typeof db) {
    this.db = _db;
  }

  createRepo(repo: Repo): void {
    const sql = `
      insert into repo (name, version, changelogText)
      values (?, ?, ?)
    `;
    const statement = this.db.query<Repo, string[]>(sql);
    const newRepo = statement.get(repo.name, repo.version, repo.changelogText);
    debug(`Created repo ${repo.name} in database`);
    repo.id = newRepo?.id ?? null;
  }

  updateRepo(repo: Repo): void {
    const sql = `
      update repo
      set version = ?, changelogText = ?, lastUpdatedAt = ?
      where name = ?
    `;
    const statement = this.db.query<Repo, string[]>(sql);
    const newRepo = statement.get(
      repo.version,
      repo.changelogText,
      repo.lastUpdatedAt,
      repo.name,
    );
    debug(`Updated repo ${repo.name} in database`);
    repo.id = newRepo?.id ?? null;
  }

  upsertRepo(repo: Repo): void {
    if (repo.isInDb()) {
      this.updateRepo(repo);
    } else {
      this.createRepo(repo);
    }
  }

  getRepoByName(name: string): Repo | undefined {
    const sql = `
      select * from repo
      where name = ?
    `;
    const statement = this.db.query<Repo, string>(sql);
    return Repo.fromDb(statement.get(name));
  }
}
