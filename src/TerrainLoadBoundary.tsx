import { Component, type ReactNode } from 'react';

type Props = { language: 'en' | 'th'; children: ReactNode };

export class TerrainLoadBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const thai = this.props.language === 'th';
    return <div>
      <p role="alert">{thai ? 'เปิดเครื่องมือภูมิประเทศไม่ได้' : 'The terrain tool did not open.'}</p>
      <button onClick={() => location.reload()}>{thai ? 'โหลดหน้าใหม่' : 'Reload page'}</button>
    </div>;
  }
}
