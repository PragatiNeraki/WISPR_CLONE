import { useTranscription } from './hooks/useTranscription';
import { RecordButton } from './components/RecordButton';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { StatusIndicator } from './components/StatusIndicator';

function App() {
  const {
    transcript,
    interimTranscript,
    isRecording,
    connectionStatus,
    error,
    hint,
    startRecording,
    stopRecording,
    clearTranscript
  } = useTranscription();

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      backgroundColor: 'var(--bg)',
      color: 'var(--text-primary)'

    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        <header style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--text-primary)'
          }}>
            Wispr Flow
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Real-time voice transcription
          </p>
        </header>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '20px'
        }}>
          <StatusIndicator
            status={connectionStatus}
            isRecording={isRecording}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '20px',
          paddingBottom: '20px'
        }}>
          <RecordButton
            isRecording={isRecording}
            onStart={startRecording}
            onStop={stopRecording}
          />
        </div>

        {hint && (
          <div style={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {hint}
          </div>
        )}

        <TranscriptDisplay
          transcript={transcript}
          interimTranscript={interimTranscript}
          error={error}
          onClear={clearTranscript}
        />

      </div>
    </div>
  );
}

export default App;
