import React from 'react'
import clsx from 'clsx'
import type { StreamState } from '../../types/dashboard'

interface StreamControlsProps {
	streamState: StreamState
	onUpdateStream: (updates: Partial<StreamState>) => void
	onRunDemo: () => void
}

export default function StreamControls({ 
	streamState, 
	onUpdateStream, 
	onRunDemo 
}: StreamControlsProps): React.ReactElement {
	const { 
		streamDemo, 
		processingSpeed, 
		enableBackpressure, 
		batchSize, 
		isStreamRunning 
	} = streamState

	return (
		<div className='bg-white rounded-lg border border-gray-200 p-4'>
			<h3 className='font-semibold mb-3'>Stream Controls</h3>
			
			<button 
				onClick={onRunDemo}
				disabled={isStreamRunning}
				className={clsx(
					'w-full rounded-lg px-4 py-2 mb-3 font-medium transition-all',
					isStreamRunning 
						? 'bg-gray-400 text-gray-200 cursor-not-allowed'
						: 'bg-green-600 text-white hover:bg-green-700'
				)}
			>
				{isStreamRunning ? 'Running...' : 'Run Stream Demo'}
			</button>
			
			{/* Processing Speed Control */}
			<div className='mb-3'>
				<label className='text-sm font-medium text-gray-700 mb-1 block'>
					Processing Speed
				</label>
				<div className='flex gap-2'>
					{(['slow', 'normal', 'fast'] as const).map(speed => (
						<button
							key={speed}
							onClick={() => onUpdateStream({ processingSpeed: speed })}
							disabled={isStreamRunning}
							className={clsx(
								'flex-1 px-3 py-1 rounded text-sm transition-all',
								processingSpeed === speed
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
								isStreamRunning && 'opacity-50 cursor-not-allowed'
							)}
						>
							{speed.charAt(0).toUpperCase() + speed.slice(1)}
						</button>
					))}
				</div>
			</div>
			
			{/* Demo-specific controls */}
			{streamDemo === 'csv' && (
				<div className='mb-3'>
					<label className='text-sm font-medium text-gray-700 mb-1 block'>
						Batch Size: {batchSize}
					</label>
					<input
						type='range'
						min='5'
						max='25'
						value={batchSize}
						onChange={e => onUpdateStream({ batchSize: Number(e.target.value) })}
						disabled={isStreamRunning}
						className='w-full'
					/>
				</div>
			)}
			
			{streamDemo === 'realtime' && (
				<>
					<label className='flex items-center gap-2 cursor-pointer mb-3'>
						<input
							type='checkbox'
							checked={enableBackpressure}
							onChange={e => onUpdateStream({ enableBackpressure: e.target.checked })}
							disabled={isStreamRunning}
							className='w-4 h-4'
						/>
						<span className='text-sm'>Enable Backpressure</span>
					</label>
					
					{/* Visual Flow Diagram */}
					<div className='bg-gray-50 p-3 rounded text-xs'>
						<div className='font-semibold mb-2'>Data Flow:</div>
						<div className='flex items-center gap-2 text-[10px]'>
							<div className='bg-blue-200 px-2 py-1 rounded'>
								Generator<br/>
								<span className='font-mono'>10ms</span>
							</div>
							<div className='text-gray-500'>→</div>
							<div className={clsx(
								'px-2 py-1 rounded',
								enableBackpressure ? 'bg-yellow-200' : 'bg-red-200'
							)}>
								Buffer<br/>
								<span className='font-mono'>{enableBackpressure ? 'Protected' : 'Overflow?'}</span>
							</div>
							<div className='text-gray-500'>→</div>
							<div className='bg-green-200 px-2 py-1 rounded'>
								Processor<br/>
								<span className='font-mono'>{processingSpeed}</span>
							</div>
						</div>
					</div>
				</>
			)}
			
			{/* Demo Description */}
			<div className='mt-3 p-3 bg-gray-100 rounded text-sm'>
				{streamDemo === 'csv' && (
					<>
						<div className='font-semibold'>CSV Processing Demo</div>
						<div className='text-gray-600 text-xs mt-1'>
							Process 100 CSV rows, filter by status, batch insert to database
						</div>
					</>
				)}
				{streamDemo === 'realtime' && (
					<>
						<div className='font-semibold'>Producer/Consumer Backpressure Demo</div>
						<div className='text-gray-600 text-xs mt-1 space-y-1'>
							<div>• 📤 <strong>Producer</strong>: Generates data every 30ms</div>
							<div>• 📥 <strong>Consumer</strong>: Processes at selected speed</div>
							<div>• 🗄️ <strong>Buffer</strong>: Limited to 5 items</div>
							<div className={clsx(
								'font-semibold',
								enableBackpressure ? 'text-green-700' : 'text-red-700'
							)}>
								• {enableBackpressure ? '🛡️ Backpressure ON' : '💥 Backpressure OFF'}: {enableBackpressure ? 'Producer waits when buffer full' : 'Data gets dropped on overflow'}
							</div>
							<div className='text-blue-700 font-medium'>• Watch the code examples above change as you toggle backpressure!</div>
						</div>
					</>
				)}
				{streamDemo === 'composition' && (
					<>
						<div className='font-semibold'>Stream Composition Demo</div>
						<div className='text-gray-600 text-xs mt-1'>
							Split, transform, and merge streams with different operations
						</div>
					</>
				)}
			</div>
		</div>
	)
}