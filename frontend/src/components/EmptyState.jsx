export default function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="empty-state anim-slide-up">
      {Icon && (
        <div className="empty-state-icon">
          <Icon width={28} height={28} />
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 340, margin: '0 auto', lineHeight: 1.65 }}>{body}</div>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}
