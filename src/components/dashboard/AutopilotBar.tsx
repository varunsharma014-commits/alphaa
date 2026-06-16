// Shared "autopilot" status bar. Appears at the top of every dashboard screen
// to reassure the user that alphaa is running and they don't need to do anything.
// The pulse animation is defined globally in globals.css (@keyframes pulse).

export function AutopilotBar({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "#0d2218",
        border: "1px solid #14532d",
        borderRadius: "8px",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "#22c55e",
          flexShrink: 0,
          animation: "pulse 2s infinite",
        }}
      />
      <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 500 }}>
        {message}
      </span>
    </div>
  )
}
