import type { Edge, Node } from 'reactflow'
import type { TaskKey, TaskState } from '../lib/dashboard'
import type { StreamEvent } from '../lib/streams'

export interface EdgeMeta {
	title: string
	animated?: boolean
}

export type StatusMap = Record<TaskKey, TaskState | 'pending'>

export type TabType = 'concurrency' | 'error-handling' | 'retries' | 'dependency-injection' | 'streams'

export type ConcurrencyMode = 'concurrent' | 'sequential' | 'fibers' | 'racing' | 'batched'

export type ProcessingSpeed = 'slow' | 'normal' | 'fast'

export type StreamDemoType = 'csv' | 'realtime' | 'composition'

export interface DashboardState {
	activeTab: TabType
	edgeStates: StatusMap
	logs: string[]
	useMocks: boolean
	sequential: boolean
	concurrencyMode: ConcurrencyMode
	runToken: number
	isRunning: boolean
	executionTime: number | null
	iterationCount: number
}

export interface StreamState {
	streamLogs: StreamEvent[]
	streamDemo: StreamDemoType
	processingSpeed: ProcessingSpeed
	enableBackpressure: boolean
	batchSize: number
	isStreamRunning: boolean
}

export interface FlowData {
	nodes: Array<Node>
	edges: Array<Edge<EdgeMeta>>
}

export interface CodeExampleProps {
	title: string
	code: string
	language?: string
	isActive?: boolean
	customStyle?: React.CSSProperties
}

export interface TabButtonProps {
	isActive: boolean
	onClick: () => void
	children: React.ReactNode
}