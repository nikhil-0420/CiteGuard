export function Chip({ kind, children, title }: { kind?: string; children: React.ReactNode; title?: string }) {
  return <span className={`chip ${kind ?? ""}`} title={title}>{children}</span>;
}
export const pretty = (s: string) => s.replace(/_/g, " ");
