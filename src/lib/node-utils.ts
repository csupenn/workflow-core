export function getStatusColor(
  status: "idle" | "running" | "completed" | "error" | undefined,
  selected: boolean,
): string {
  switch (status) {
    case "running":
      return "border-yellow-500/70 shadow-lg shadow-yellow-500/30 ring-1 ring-yellow-500/50"
    case "completed":
      return "border-green-500/70 shadow-lg shadow-green-500/30 ring-1 ring-green-500/50"
    case "error":
      return "border-red-500/70 shadow-lg shadow-red-500/30 ring-1 ring-red-500/50"
    default:
      return selected
        ? "border-primary/80 shadow-xl shadow-primary/20 ring-2 ring-primary/50"
        : "border-border/60 shadow-md"
  }
}
