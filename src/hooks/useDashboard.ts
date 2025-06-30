import { useCallback, useEffect, useState } from 'react'
import { runDashboard, type TaskKey, type TaskState } from '../lib/dashboard'
import type { DashboardState } from '../types/dashboard'

export function useDashboard() {
	const [dashboardState, setDashboardState] = useState<DashboardState>({
		activeTab: 'concurrency',
		edgeStates: {
			user: 'pending',
			orders: 'pending',
			recs: 'pending'
		},
		logs: [],
		useMocks: false,
		sequential: false,
		concurrencyMode: 'concurrent',
		runToken: 0,
		isRunning: false,
		executionTime: null,
		iterationCount: 1
	})

	const pushLog = useCallback((msg: string) => {
		setDashboardState(prev => ({
			...prev,
			logs: [msg, ...prev.logs].slice(0, 50)
		}))
	}, [])

	const onState = useCallback((k: TaskKey, s: TaskState) => {
		setDashboardState(prev => ({
			...prev,
			edgeStates: { ...prev.edgeStates, [k]: s }
		}))
	}, [])

	const runDashboardDemo = useCallback(() => {
		setDashboardState(prev => ({ ...prev, runToken: prev.runToken + 1 }))
	}, [])

	const updateDashboardState = useCallback((updates: Partial<DashboardState>) => {
		setDashboardState(prev => ({ ...prev, ...updates }))
	}, [])

	// Run dashboard effect
	useEffect(() => {
		if (dashboardState.runToken === 0) return // Skip initial render
		
		setDashboardState(prev => ({
			...prev,
			isRunning: true,
			executionTime: null,
			edgeStates: { user: 'pending', orders: 'pending', recs: 'pending' },
			logs: []
		}))
		
		const startTime = Date.now()
		let completed = false
		
		// Track completion with a closure over current state
		const trackingOnState = (k: TaskKey, s: TaskState) => {
			onState(k, s)
			// Check if all tasks are done after state update
			setDashboardState(current => {
				const updated = { ...current.edgeStates, [k]: s }
				if (!completed && Object.values(updated).every(state => state !== 'pending')) {
					const executionTime = Date.now() - startTime
					completed = true
					return {
						...current,
						edgeStates: updated,
						executionTime,
						isRunning: false
					}
				}
				return { ...current, edgeStates: updated }
			})
		}
		
		runDashboard({ 
			useMocks: dashboardState.useMocks, 
			sequential: dashboardState.sequential, 
			concurrencyMode: dashboardState.concurrencyMode, 
			onState: trackingOnState, 
			pushLog 
		})
	}, [dashboardState.runToken, dashboardState.useMocks, dashboardState.sequential, dashboardState.concurrencyMode, onState, pushLog])

	return {
		dashboardState,
		updateDashboardState,
		runDashboardDemo,
		pushLog,
		onState
	}
}