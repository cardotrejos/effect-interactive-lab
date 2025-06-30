import { useCallback, useState } from 'react'
import { 
	runCSVProcessingDemo, 
	runRealTimeStreamDemo, 
	runStreamCompositionDemo,
	type StreamEvent 
} from '../lib/streams'
import type { StreamState } from '../types/dashboard'

export function useStreams() {
	const [streamState, setStreamState] = useState<StreamState>({
		streamLogs: [],
		streamDemo: 'csv',
		processingSpeed: 'normal',
		enableBackpressure: true,
		batchSize: 10,
		isStreamRunning: false
	})

	const onStreamEvent = useCallback((event: StreamEvent) => {
		setStreamState(prev => ({
			...prev,
			streamLogs: [event, ...prev.streamLogs].slice(0, 100)
		}))
	}, [])

	const updateStreamState = useCallback((updates: Partial<StreamState>) => {
		setStreamState(prev => ({ ...prev, ...updates }))
	}, [])

	const runStreamDemo = useCallback(async () => {
		setStreamState(prev => ({
			...prev,
			isStreamRunning: true,
			streamLogs: []
		}))
		
		const options = {
			onEvent: onStreamEvent,
			processingSpeed: streamState.processingSpeed,
			enableBackpressure: streamState.enableBackpressure,
			batchSize: streamState.batchSize
		}
		
		try {
			const { Effect } = await import('effect')
			let result
			switch (streamState.streamDemo) {
				case 'csv':
					result = await Effect.runPromise(runCSVProcessingDemo(options))
					break
				case 'realtime':
					result = await Effect.runPromise(runRealTimeStreamDemo(options))
					break
				case 'composition':
					result = await Effect.runPromise(runStreamCompositionDemo(options))
					break
			}
			return result
		} catch (error) {
			// Only log error if it's not an interruption
			if (!String(error).includes('Interrupted')) {
				onStreamEvent({
					type: 'error',
					message: `❌ Error: ${error}`,
					timestamp: Date.now()
				})
			}
		} finally {
			setStreamState(prev => ({ ...prev, isStreamRunning: false }))
		}
	}, [streamState.streamDemo, streamState.processingSpeed, streamState.enableBackpressure, streamState.batchSize, onStreamEvent])

	return {
		streamState,
		updateStreamState,
		runStreamDemo,
		onStreamEvent
	}
}