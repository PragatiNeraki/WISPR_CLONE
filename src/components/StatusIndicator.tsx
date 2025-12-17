import { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
    status: ConnectionStatus;
    isRecording: boolean;
}

export function StatusIndicator({ status, isRecording }: StatusIndicatorProps) {
    const getStatusText = () => {
        if (isRecording) return 'Recording...';

        switch (status) {
            case ConnectionStatus.CONNECTING:
                return 'Connecting...';
            case ConnectionStatus.CONNECTED:
                return 'Connected';
            case ConnectionStatus.DISCONNECTED:
                return 'Disconnected';
            case ConnectionStatus.ERROR:
                return 'Connection Error';
            default:
                return 'Ready';
        }
    };

    const getStatusColor = () => {
        if (isRecording) return '#ef4444';

        switch (status) {
            case ConnectionStatus.CONNECTING:
                return '#eab308';
            case ConnectionStatus.CONNECTED:
                return '#10b981';
            case ConnectionStatus.DISCONNECTED:
                return '#6b7280';
            case ConnectionStatus.ERROR:
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(),
                animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none'
            }} />
            <span>{getStatusText()}</span>
        </div>
    );
}
