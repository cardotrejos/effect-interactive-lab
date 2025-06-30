import React, { useMemo } from 'react'
import ReactFlow, { type Edge, type Node } from 'reactflow'
import 'reactflow/dist/style.css'
import clsx from 'clsx'
import CodeExample from '../shared/CodeExample'
import { getConcurrencyExample, getTraditionalExample, getConcurrencyTitle, getTraditionalTitle } from '../examples/concurrencyExamples'
import type { DashboardState, EdgeMeta } from '../../types/dashboard'
import type { TaskState } from '../../lib/dashboard'

const FLOW_NODES: Array<Node> = [
	{ id: 'app', type: 'input', position: { x: 0, y: 0 }, data: { label: 'Dashboard Program' } },
	{ id: 'user', position: { x: -240, y: 160 }, data: { label: 'User Profile' } },
	{ id: 'orders', position: { x: 0, y: 160 }, data: { label: 'Order History' } },
	{ id: 'recs', position: { x: 240, y: 160 }, data: { label: 'Recommendations' } },
	{ id: 'http', type: 'output', position: { x: -240, y: 320 }, data: { label: 'HTTP API' } },
	{ id: 'db', type: 'output', position: { x: 0, y: 320 }, data: { label: 'Database' } },
	{ id: 'ml', type: 'output', position: { x: 240, y: 320 }, data: { label: 'ML Service' } }
]

const baseEdges: Array<Edge<EdgeMeta>> = [
	{ id: 'app-user', source: 'app', target: 'user', data: { title: 'fetch user' } },
	{ id: 'app-orders', source: 'app', target: 'orders', data: { title: 'fetch orders' } },
	{ id: 'app-recs', source: 'app', target: 'recs', data: { title: 'get recs' } },
	{ id: 'user-http', source: 'user', target: 'http', style: { strokeDasharray: '4 4' } },
	{ id: 'orders-db', source: 'orders', target: 'db', style: { strokeDasharray: '4 4' } },
	{ id: 'recs-ml', source: 'recs', target: 'ml', style: { strokeDasharray: '4 4' } }
]

function edgeStyle(state: TaskState | 'pending'): React.CSSProperties {
	switch (state) {
		case 'success':
			return { strokeWidth: 3, stroke: '#22c55e' }
		case 'timeout':
			return { stroke: '#dc2626', strokeWidth: 3 }
		case 'error':
			return { stroke: '#f97316', strokeWidth: 3 }
		default:
			return { animation: 'dash 2s linear infinite', stroke: '#3b82f6' }
	}
}

function getLogClass(log: string): string {
	if (log.includes('✅')) return 'text-green-600 font-semibold'
	if (log.includes('❌')) return 'text-red-600 font-semibold'
	if (log.includes('🚀')) return 'text-blue-600'
	if (log.includes('━━━')) return 'text-gray-900 font-bold bg-gray-200 px-2 py-1 rounded'
	return 'text-gray-700'
}

interface ConcurrencyTabProps {
	dashboardState: DashboardState
	onUpdateDashboard: (updates: Partial<DashboardState>) => void
	onRunDemo: () => void
}

export default function ConcurrencyTab({ 
	dashboardState, 
	onUpdateDashboard, 
	onRunDemo 
}: ConcurrencyTabProps): React.ReactElement {
	const { edgeStates, logs, useMocks, concurrencyMode, isRunning, executionTime, iterationCount } = dashboardState

	/* derived edges */
	const edges: Array<Edge<EdgeMeta>> = useMemo(() => baseEdges.map(e => {
		if (e.id === 'app-user') return { ...e, style: { ...e.style, ...edgeStyle(edgeStates.user) } }
		if (e.id === 'app-orders')
			return { ...e, style: { ...e.style, ...edgeStyle(edgeStates.orders) } }
		if (e.id === 'app-recs')
			return { ...e, style: { ...e.style, ...edgeStyle(edgeStates.recs) } }
		return e
	}), [edgeStates])

	return (
		<>
			<div className='text-center text-sm text-gray-500'>
				This dashboard loads user data from 3 different services using different Effect concurrency patterns.
				Each mode demonstrates unique Effect capabilities beyond simple Promise.all/race.
			</div>

			<div className='flex gap-6'>
				<div className='flex-1'>
					<div style={{ height: 500 }} className='border border-gray-300 rounded-lg bg-gray-50'>
						<ReactFlow 
							nodes={FLOW_NODES} 
							edges={edges} 
							fitView 
							fitViewOptions={{ padding: 0.2 }}
							proOptions={{ hideAttribution: true }}
						/>
					</div>
					
					<div className='mt-4 flex items-center gap-6 text-sm'>
						<div className='flex items-center gap-2'>
							<div className='w-16 h-1 bg-blue-500' style={{ animation: 'dash 2s linear infinite' }}></div>
							<span>Running</span>
						</div>
						<div className='flex items-center gap-2'>
							<div className='w-16 h-1 bg-green-500'></div>
							<span>Success</span>
						</div>
						<div className='flex items-center gap-2'>
							<div className='w-16 h-1 bg-red-500'></div>
							<span>Timeout</span>
						</div>
					</div>
				</div>

				<div className='w-96 flex flex-col gap-3'>
					<div className='bg-white rounded-lg border border-gray-200 p-4'>
						<h3 className='font-semibold mb-3'>Controls</h3>
						
						<button 
							onClick={onRunDemo}
							disabled={isRunning}
							className={clsx(
								'w-full rounded-lg px-4 py-2 mb-3 font-medium transition-all',
								isRunning 
									? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
									: 'bg-blue-600 text-white hover:bg-blue-700'
							)}>
							{isRunning ? 'Running...' : 'Run Dashboard'}
						</button>
						
						{/* Performance Stats */}
						{executionTime && (
							<div className='mb-3 p-2 bg-green-50 rounded border border-green-200'>
								<div className='text-sm font-semibold text-green-800'>⚡ Performance</div>
								<div className='text-xs text-green-700'>Execution time: {executionTime}ms</div>
								<div className='text-xs text-green-700'>
									{dashboardState.sequential ? 'Sequential' : 'Concurrent'} mode
								</div>
							</div>
						)}
						
						{/* Iteration Control */}
						<div className='mb-3'>
							<label className='text-sm font-medium text-gray-700 mb-1 block'>
								Run Multiple Times: {iterationCount}
							</label>
							<input
								type='range'
								min='1'
								max='5'
								value={iterationCount}
								onChange={e => onUpdateDashboard({ iterationCount: Number(e.target.value) })}
								disabled={isRunning}
								className='w-full'
							/>
							<div className='text-xs text-gray-500 mt-1'>
								Run {iterationCount} time{iterationCount > 1 ? 's' : ''} to see performance patterns
							</div>
						</div>
						
						{/* Concurrency Mode Selector */}
						<div className='mb-3'>
							<label className='text-sm font-medium text-gray-700 mb-2 block'>
								Concurrency Pattern
							</label>
							<select
								value={concurrencyMode}
								onChange={e => onUpdateDashboard({ concurrencyMode: e.target.value as typeof concurrencyMode })}
								disabled={isRunning}
								className='w-full border border-gray-300 rounded px-3 py-2 text-sm'
							>
								<option value='concurrent'>Effect.all - Standard Concurrent</option>
								<option value='sequential'>Effect.bind - Sequential Pipeline</option>
								<option value='fibers'>Fiber.fork - Manual Fiber Control</option>
								<option value='racing'>Effect.race - First Winner Continues</option>
								<option value='batched'>Effect.forEach - Controlled Batching</option>
							</select>
						</div>
						
						<div className='space-y-2'>
							<label className='flex items-center gap-2 cursor-pointer'>
								<input
									type='checkbox'
									checked={useMocks}
									onChange={e => onUpdateDashboard({ useMocks: e.target.checked })}
									disabled={isRunning}
									className='w-4 h-4'
								/>
								<span>Use mock services (instant)</span>
							</label>
						</div>
						
						<div className='mt-3 p-3 bg-gray-100 rounded text-sm'>
							<div className='font-semibold'>
								Mode: {concurrencyMode.charAt(0).toUpperCase() + concurrencyMode.slice(1)}
							</div>
							<div className='text-gray-600 text-xs mt-1'>
								{concurrencyMode === 'concurrent' && 'Standard concurrent execution with Effect.all'}
								{concurrencyMode === 'sequential' && 'Sequential pipeline using Effect.bind'}
								{concurrencyMode === 'fibers' && 'Manual fiber management with fork/join'}
								{concurrencyMode === 'racing' && 'Race for first completion, continue with others'}
								{concurrencyMode === 'batched' && 'Controlled concurrency with batching'}
							</div>
						</div>
					</div>

					<div className='bg-white rounded-lg border border-gray-200 p-4 flex-1 flex flex-col'>
						<h3 className='font-semibold mb-2'>Execution Log</h3>
						<div className='bg-gray-900 rounded p-3 flex-1 overflow-auto font-mono text-xs'>
							{logs.length === 0 ? (
								<div className='text-gray-500 text-center py-8'>
									Click "Run Dashboard" to start
								</div>
							) : (
								logs.map((l, i) => (
									<div key={i} className={clsx('mb-1', getLogClass(l))}>
										{l}
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Performance Comparison */}
			{executionTime && !useMocks && (
				<div className='mt-6 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200'>
					<h3 className='text-center text-lg font-semibold text-blue-900 mb-3'>🏁 Performance Results</h3>
					<div className='grid grid-cols-2 gap-4 text-sm'>
						<div className={clsx(
							'p-3 rounded border-2 transition-all',
							dashboardState.sequential ? 'bg-gray-50 border-gray-300' : 'bg-white border-green-500 shadow-lg'
						)}>
							<div className='font-semibold text-gray-800'>Concurrent Execution</div>
							<div className='text-xs text-gray-600 mt-1'>
								All 3 tasks start immediately and run in parallel
							</div>
							{concurrencyMode === 'concurrent' && (
								<div className='mt-2 text-green-700 font-semibold'>
									✅ Current: {executionTime}ms
								</div>
							)}
						</div>
						<div className={clsx(
							'p-3 rounded border-2 transition-all',
							concurrencyMode !== 'concurrent' ? 'bg-white border-orange-500 shadow-lg' : 'bg-gray-50 border-gray-300'
						)}>
							<div className='font-semibold text-gray-800'>
								{concurrencyMode === 'sequential' && 'Sequential Execution'}
								{concurrencyMode === 'fibers' && 'Fiber-Based Execution'}
								{concurrencyMode === 'racing' && 'Racing Execution'}
								{concurrencyMode === 'batched' && 'Batched Execution'}
								{concurrencyMode === 'concurrent' && 'Advanced Execution Mode'}
							</div>
							<div className='text-xs text-gray-600 mt-1'>
								{concurrencyMode === 'sequential' && 'Tasks run one after another in a pipeline'}
								{concurrencyMode === 'fibers' && 'Manual fiber control with fork/join operations'}
								{concurrencyMode === 'racing' && 'First task wins, others continue after'}
								{concurrencyMode === 'batched' && 'Controlled concurrency with resource limits'}
								{concurrencyMode === 'concurrent' && 'Standard parallel execution pattern'}
							</div>
							{concurrencyMode !== 'concurrent' && (
								<div className='mt-2 text-orange-700 font-semibold'>
									⚡ Current: {executionTime}ms
								</div>
							)}
						</div>
					</div>
					<div className='text-center mt-3 text-xs text-blue-700'>
						💡 Try switching between modes to see the performance difference!
					</div>
				</div>
			)}

			<div className='mt-6 space-y-4'>
				<h3 className='text-center text-lg font-semibold text-gray-700'>Effect Concurrency Patterns - Beyond Promise.all/race</h3>
				
				<div className='grid grid-cols-2 gap-4'>
					<div className='space-y-3'>
						<h4 className='text-sm font-semibold text-gray-600 text-center'>Current Effect Pattern</h4>
						
						<CodeExample
							title={getConcurrencyTitle(concurrencyMode)}
							code={getConcurrencyExample(concurrencyMode)}
							isActive={true}
						/>
					</div>
					
					<div className='space-y-3'>
						<h4 className='text-sm font-semibold text-gray-600 text-center'>Traditional Implementation</h4>
						
						<CodeExample
							title={getTraditionalTitle(concurrencyMode)}
							code={getTraditionalExample(concurrencyMode)}
							customStyle={{ fontSize: '10px' }}
						/>
					</div>
				</div>
			</div>
		</>
	)
}