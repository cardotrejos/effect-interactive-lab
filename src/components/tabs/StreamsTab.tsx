import React from 'react'
import clsx from 'clsx'
import CodeExample from '../shared/CodeExample'
import StreamControls from '../shared/StreamControls'
import { 
	effectBackpressureExample, 
	traditionalBackpressureExample, 
	streamErrorHandlingExample,
	nodeStreamsExample,
	manualBackpressureExample
} from '../examples/streamExamples'
import type { StreamState } from '../../types/dashboard'

interface StreamsTabProps {
	streamState: StreamState
	onUpdateStream: (updates: Partial<StreamState>) => void
	onRunDemo: () => void
}

export default function StreamsTab({ 
	streamState, 
	onUpdateStream, 
	onRunDemo 
}: StreamsTabProps): React.ReactElement {
	const { streamLogs, streamDemo, enableBackpressure } = streamState

	return (
		<div className='space-y-4'>
			<div className='text-center text-sm text-gray-600 max-w-3xl mx-auto'>
				Effect Streams provide composable, resource-safe, backpressure-aware data processing. 
				Handle infinite data sources, transform streams, and manage resources automatically.
			</div>
			
			{/* Stream Demo Selector */}
			<div className='flex justify-center gap-2 mb-4'>
				<button
					onClick={() => onUpdateStream({ streamDemo: 'csv' })}
					className={clsx(
						'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
						streamDemo === 'csv' 
							? 'bg-green-600 text-white' 
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					)}
				>
					CSV Processing
				</button>
				<button
					onClick={() => onUpdateStream({ streamDemo: 'realtime' })}
					className={clsx(
						'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
						streamDemo === 'realtime' 
							? 'bg-green-600 text-white' 
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					)}
				>
					Real-Time Stream
				</button>
				<button
					onClick={() => onUpdateStream({ streamDemo: 'composition' })}
					className={clsx(
						'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
						streamDemo === 'composition' 
							? 'bg-green-600 text-white' 
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					)}
				>
					Stream Composition
				</button>
			</div>
			
			<div className='grid grid-cols-2 gap-4'>
				{/* Interactive Demo Section */}
				<div className='space-y-4'>
					<StreamControls
						streamState={streamState}
						onUpdateStream={onUpdateStream}
						onRunDemo={onRunDemo}
					/>
					
					{/* Stream Event Log */}
					<div className='bg-white rounded-lg border border-gray-200 p-4 flex-1'>
						<h3 className='font-semibold mb-2'>Stream Events</h3>
						<div className='bg-gray-900 rounded p-3 h-64 overflow-auto font-mono text-xs'>
							{streamLogs.length === 0 ? (
								<div className='text-gray-500 text-center py-8'>
									Click "Run Stream Demo" to start
								</div>
							) : (
								streamLogs.map((event, i) => (
									<div 
										key={i} 
										className={clsx(
											'mb-1',
											event.type === 'complete' && 'text-green-400 font-semibold',
											event.type === 'error' && 'text-red-400 font-semibold',
											event.type === 'batch' && 'text-blue-400',
											event.type === 'backpressure' && 'text-yellow-400',
											event.type === 'transform' && 'text-purple-400',
											event.type === 'csv-row' && 'text-gray-400'
										)}
									>
										{event.message}
									</div>
								))
							)}
						</div>
					</div>
				</div>
				
				{/* Code Examples */}
				<div className='space-y-3'>
					
					<CodeExample
						title="Effect Backpressure Control"
						code={effectBackpressureExample}
						isActive={enableBackpressure}
					/>
					
					<CodeExample
						title="Without Backpressure (Traditional)"
						code={traditionalBackpressureExample}
						isActive={!enableBackpressure}
					/>
					
					<CodeExample
						title="Stream Error Handling"
						code={streamErrorHandlingExample}
					/>
				</div>
			</div>
			
			{/* Code Comparison Section */}
			<div className='mt-6'>
				<h3 className='text-center text-lg font-semibold text-gray-700 mb-4'>Effect Streams vs Node.js Streams</h3>
				<div className='grid grid-cols-2 gap-4'>
					<div className='space-y-3'>
						<h4 className='text-sm font-semibold text-gray-600 text-center'>Traditional Node.js Streams</h4>
						
						<CodeExample
							title="Manual Stream Management"
							code={nodeStreamsExample}
							customStyle={{ fontSize: '11px' }}
						/>
						
						<CodeExample
							title="No Built-in Backpressure"
							code={manualBackpressureExample}
							customStyle={{ fontSize: '11px' }}
						/>
					</div>
				</div>
			</div>

			<div className='mt-6 grid grid-cols-3 gap-4 text-sm'>
				<div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
					<h5 className='font-semibold text-blue-900 mb-2'>🌊 Stream Features</h5>
					<ul className='text-blue-800 space-y-1 text-xs'>
						<li>• Automatic backpressure handling</li>
						<li>• Built-in batching & grouping</li>
						<li>• Concurrent processing control</li>
						<li>• Resource-safe by design</li>
						<li>• Composable operators</li>
					</ul>
				</div>
				<div className='bg-green-50 p-4 rounded-lg border border-green-200'>
					<h5 className='font-semibold text-green-900 mb-2'>🔄 Transform & Process</h5>
					<ul className='text-green-800 space-y-1 text-xs'>
						<li>• Map, filter, scan, fold</li>
						<li>• Time-based operations</li>
						<li>• Split, merge, broadcast</li>
						<li>• Windowing & buffering</li>
						<li>• Custom operators</li>
					</ul>
				</div>
				<div className='bg-purple-50 p-4 rounded-lg border border-purple-200'>
					<h5 className='font-semibold text-purple-900 mb-2'>🛡️ Error & Resource Safety</h5>
					<ul className='text-purple-800 space-y-1 text-xs'>
						<li>• Automatic resource cleanup</li>
						<li>• Structured error handling</li>
						<li>• Retry with backoff</li>
						<li>• Dead letter queues</li>
						<li>• Graceful shutdown</li>
					</ul>
				</div>
			</div>
		</div>
	)
}