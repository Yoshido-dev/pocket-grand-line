/**
 * Delivery job state machine plus the Progress view used by every `when`
 * condition. State per job: -1 not started, 0..steps-1 = current step,
 * steps = done. Gating: a job is open when its requirements are done and it is
 * among the first `maxOpen` unfinished candidates in list order.
 */
import type { ItemDef, JobDef, Progress, StepDef, Story } from './types';

export interface ActiveStep {
  job: JobDef;
  step: StepDef;
  index: number;
  /** Item carried for this step. */
  item: ItemDef | undefined;
}

export class Jobs {
  readonly story: Story;
  state: Record<string, number> = {};
  flags = new Set<string>();
  /** Job id the Log Pose, the guide gull and the held item follow. */
  tracked: string | null = null;
  /** Opened chests (their ids also unlock rewards). */
  chests = new Set<string>();
  night = false;
  onChange: (() => void) | null = null;
  readonly progress: Progress;

  constructor(story: Story, saved?: Record<string, number>, tracked?: string | null, flags?: string[], chests?: string[], night?: boolean) {
    this.story = story;
    for (const j of story.jobs) {
      const step = saved?.[j.id];
      // A partial/corrupt save must never index between steps or strand a job.
      this.state[j.id] = typeof step === 'number' && Number.isFinite(step) ? Math.max(-1, Math.min(j.steps.length, Math.floor(step))) : -1;
    }
    this.tracked = typeof tracked === 'string' && this.isActive(tracked) ? tracked : null;
    for (const f of flags ?? []) this.flags.add(f);
    for (const c of chests ?? []) this.chests.add(c);
    this.night = !!night;
    const self = this;
    this.progress = {
      done: (id) => self.isDone(id),
      active: (id, step) => self.isActive(id) && (step === undefined || self.state[id] === step),
      step: (id) => self.state[id] ?? -1,
      flag: (n) => self.flags.has(n),
      count: () => self.doneCount(),
      get night() {
        return self.night;
      },
    };
  }

  item(id: string | undefined): ItemDef | undefined {
    return id ? this.story.items.find((i) => i.id === id) : undefined;
  }

  job(id: string) {
    return this.story.jobs.find((j) => j.id === id);
  }

  isDone(id: string) {
    const j = this.job(id);
    return !!j && this.state[id] >= j.steps.length;
  }

  isActive(id: string) {
    const j = this.job(id);
    return !!j && this.state[id] >= 0 && this.state[id] < j.steps.length;
  }

  setFlag(name: string, on = true) {
    if (on) this.flags.add(name);
    else this.flags.delete(name);
    this.onChange?.();
  }

  /** Item currently carried for an active job. */
  carried(j: JobDef): ItemDef | undefined {
    const k = this.state[j.id];
    if (k < 0 || k >= j.steps.length) return undefined;
    const step = j.steps[k];
    if (step.item) return this.item(step.item);
    for (let i = k - 1; i >= 0; i--) if (j.steps[i].gets) return this.item(j.steps[i].gets);
    return this.item(j.gets);
  }

  /** Jobs currently open: in progress, or offered (requirements met, within maxOpen). */
  open(): JobDef[] {
    const out: JobDef[] = [];
    for (const j of this.story.jobs) {
      const k = this.state[j.id];
      if (k >= j.steps.length) continue;
      if (k >= 0) out.push(j);
    }
    for (const j of this.story.jobs) {
      if (out.length >= this.story.maxOpen) break;
      if (this.state[j.id] !== -1) continue;
      if ((j.requires ?? []).every((r) => this.isDone(r))) out.push(j);
    }
    return out;
  }

  /** A job this character can offer right now. */
  offerFrom(charId: string): JobDef | null {
    for (const j of this.open()) if (j.giver === charId && this.state[j.id] === -1) return j;
    return null;
  }

  /** An active step that ends at this character. Prefers the tracked job. */
  stepAt(charId: string): ActiveStep | null {
    let hit: ActiveStep | null = null;
    for (const a of this.active()) {
      if (a.step.to !== charId) continue;
      if (a.job.id === this.tracked) return a;
      hit ??= a;
    }
    return hit;
  }

  active(): ActiveStep[] {
    const out: ActiveStep[] = [];
    for (const j of this.story.jobs) {
      const k = this.state[j.id];
      if (k >= 0 && k < j.steps.length) out.push({ job: j, step: j.steps[k], index: k, item: this.carried(j) });
    }
    return out;
  }

  /** Characters with a job to give (for "!" markers). */
  givers(): Set<string> {
    const s = new Set<string>();
    for (const j of this.open()) if (this.state[j.id] === -1) s.add(j.giver);
    return s;
  }

  start(j: JobDef) {
    this.state[j.id] = 0;
    this.tracked = j.id;
    this.onChange?.();
  }

  /** Advance the job one step. Returns true when the job completes. */
  advance(j: JobDef): boolean {
    this.state[j.id] = Math.min(j.steps.length, this.state[j.id] + 1);
    const done = this.state[j.id] >= j.steps.length;
    if (done && this.tracked === j.id) this.tracked = this.active()[0]?.job.id ?? null;
    this.onChange?.();
    return done;
  }

  doneCount() {
    return this.story.jobs.filter((j) => this.isDone(j.id)).length;
  }

  allDone() {
    return this.story.jobs.every((j) => this.isDone(j.id));
  }

  /** The step the Log Pose follows. */
  trackedStep(): ActiveStep | null {
    const act = this.active();
    if (act.length === 0) return null;
    return act.find((a) => a.job.id === this.tracked) ?? act[0];
  }

  /** Every unlocked reward id (from finished jobs and opened chests). */
  unlocked(): Set<string> {
    const s = new Set<string>();
    for (const j of this.story.jobs)
      if (this.isDone(j.id)) {
        s.add(j.id);
        if (j.reward?.emote) s.add(j.reward.emote);
        if (j.reward?.outfit) s.add(j.reward.outfit);
      }
    for (const c of this.chests) s.add(c);
    return s;
  }
}
