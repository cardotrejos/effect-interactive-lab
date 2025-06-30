import React from 'react'
import TabNavigation from './shared/TabNavigation'
import ConcurrencyTab from './tabs/ConcurrencyTab'
import ErrorHandlingTab from './tabs/ErrorHandlingTab'
import RetriesTab from './tabs/RetriesTab'
import DependencyInjectionTab from './tabs/DependencyInjectionTab'
import StreamsTab from './tabs/StreamsTab'
import { useDashboard } from '../hooks/useDashboard'
import { useStreams } from '../hooks/useStreams'

export default function DashboardFlow(): React.ReactElement {
	const { 
		dashboardState, 
		updateDashboardState, 
		runDashboardDemo 
	} = useDashboard()
	
	const { 
		streamState, 
		updateStreamState, 
		runStreamDemo 
	} = useStreams()

	const { activeTab } = dashboardState

	return (
		<div className='flex flex-col gap-4 p-6 max-w-7xl mx-auto'>
			<div className='text-center'>
				<h1 className='text-3xl font-bold mb-2'>Effect Framework Demo</h1>
				<p className='text-gray-600 mb-2'>
					Explore Effect's powerful features for building robust applications
				</p>
			</div>

			<TabNavigation 
				activeTab={activeTab} 
				onTabChange={(tab) => updateDashboardState({ activeTab: tab })} 
			/>

			{activeTab === 'concurrency' && (
				<ConcurrencyTab
					dashboardState={dashboardState}
					onUpdateDashboard={updateDashboardState}
					onRunDemo={runDashboardDemo}
				/>
			)}

			{activeTab === 'error-handling' && <ErrorHandlingTab />}

			{activeTab === 'retries' && <RetriesTab />}

			{activeTab === 'dependency-injection' && <DependencyInjectionTab />}

			{activeTab === 'streams' && (
				<StreamsTab
					streamState={streamState}
					onUpdateStream={updateStreamState}
					onRunDemo={runStreamDemo}
				/>
			)}
		</div>
	)
}