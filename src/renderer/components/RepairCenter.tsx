import { Archive, RotateCcw, Save, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { AgentEvent, ProjectRecord, ProjectSnapshot } from '../../shared/contracts';

export function RepairCenter({
  project,
  events,
  busy,
  onRepair,
  onProjectUpdated,
}: {
  project: ProjectRecord;
  events: readonly AgentEvent[];
  busy: boolean;
  onRepair: (prompt: string) => Promise<void>;
  onProjectUpdated: (project: ProjectRecord) => void;
}) {
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [working, setWorking] = useState(false);
  const findings = events.filter((event) => event.kind === 'error').slice(-3);

  async function refresh() {
    setSnapshots(await window.noobi.listProjectSnapshots(project.id));
  }

  useEffect(() => { void refresh(); }, [project.id]);

  async function saveSnapshot() {
    setWorking(true);
    try { await window.noobi.createProjectSnapshot(project.id, '修复前快照'); await refresh(); }
    finally { setWorking(false); }
  }

  async function restore(snapshot: ProjectSnapshot) {
    if (!window.confirm(`恢复「${snapshot.label}」？当前工作区将被替换。`)) return;
    setWorking(true);
    try { onProjectUpdated(await window.noobi.restoreProjectSnapshot(project.id, snapshot.id)); }
    finally { setWorking(false); }
  }

  if (findings.length === 0 && snapshots.length === 0 && project.status !== 'failed') return null;
  const latestFinding = findings.at(-1);
  return (
    <section className="repair-center" aria-label="修复中心">
      <header>
        <div><span>REPAIR CENTER</span><strong>修复与版本快照</strong></div>
        <button type="button" disabled={working || busy} onClick={() => void saveSnapshot()}><Save size={13} /> 保存快照</button>
      </header>
      {latestFinding ? (
        <div className="repair-finding">
          <Wrench size={15} aria-hidden="true" />
          <div><strong>{latestFinding.title}</strong><p>{latestFinding.message}</p></div>
          <button type="button" disabled={busy} onClick={() => void onRepair(`请处理最新宿主/Reviewer 发现：${latestFinding.message}\n修复后运行构建、自动试玩并回报证据。`)}>开始修复</button>
        </div>
      ) : null}
      {snapshots.length > 0 ? (
        <div className="repair-snapshots" aria-label="项目快照">
          {snapshots.slice().reverse().slice(0, 3).map((snapshot) => (
            <div key={snapshot.id}><Archive size={13} /><span>{snapshot.label}</span><button type="button" disabled={working || busy} onClick={() => void restore(snapshot)}><RotateCcw size={12} />恢复</button></div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
