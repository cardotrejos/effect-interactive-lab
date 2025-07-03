import React from 'react'
import clsx from 'clsx'
import type { TabType, TabButtonProps } from '../../types/dashboard'

function TabButton({ isActive, onClick, children }: TabButtonProps): React.ReactElement {
	return (
		<button
			onClick={onClick}
			className={clsx(
				'px-4 py-2 rounded-lg font-medium transition-all',
				isActive 
					? 'bg-blue-600 text-white' 
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
			)}
		>
			{children}
		</button>
	)
}

interface TabNavigationProps {
	activeTab: TabType
	onTabChange: (tab: TabType) => void
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps): React.ReactElement {
	return (
		<div className='flex justify-center gap-2 mb-4'>
			<TabButton
				isActive={activeTab === 'concurrency'}
				onClick={() => onTabChange('concurrency')}
			>
				Concurrency
			</TabButton>
			<TabButton
				isActive={activeTab === 'error-handling'}
				onClick={() => onTabChange('error-handling')}
			>
				Error Handling
			</TabButton>
			<TabButton
				isActive={activeTab === 'retries'}
				onClick={() => onTabChange('retries')}
			>
				Retries & Resilience
			</TabButton>
			<TabButton
				isActive={activeTab === 'dependency-injection'}
				onClick={() => onTabChange('dependency-injection')}
			>
				Dependency Injection
			</TabButton>
			<TabButton
				isActive={activeTab === 'streams'}
				onClick={() => onTabChange('streams')}
			>
				Streams
			</TabButton>
			<TabButton
				isActive={activeTab === 'fundamentals'}
				onClick={() => onTabChange('fundamentals')}
			>
				Effect Fundamentals
			</TabButton>
		</div>
	)
}