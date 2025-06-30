import React from 'react'
import CodeExample from '../shared/CodeExample'
import { effectRetriesExample, traditionalRetriesExample } from '../examples/retriesExamples'

export default function RetriesTab(): React.ReactElement {
	return (
		<div className='space-y-4'>
			<div className='text-center text-sm text-gray-600 max-w-3xl mx-auto'>
				Effect provides sophisticated retry strategies with exponential backoff, circuit breakers, and conditional retries. 
				Build resilient applications with minimal code.
			</div>
			
			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-3'>
					<h4 className='text-sm font-semibold text-gray-600 text-center'>Effect Approach</h4>
					
					<CodeExample
						title="Smart Retry Strategies"
						code={effectRetriesExample}
						isActive={true}
						customStyle={{ fontSize: '12px' }}
					/>
				</div>
				
				<div className='space-y-3'>
					<h4 className='text-sm font-semibold text-gray-600 text-center'>Traditional Async/Await</h4>
					
					<CodeExample
						title="Manual Retry Implementation"
						code={traditionalRetriesExample}
						customStyle={{ fontSize: '12px' }}
					/>
				</div>
			</div>

			<div className='bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200'>
				<h5 className='font-semibold text-blue-900 mb-3'>🚀 Effect Retry Features</h5>
				<div className='grid grid-cols-3 gap-4 text-xs'>
					<div>
						<h6 className='font-semibold text-blue-800 mb-1'>Retry Policies</h6>
						<ul className='text-blue-700 space-y-0.5'>
							<li>• Fixed delay</li>
							<li>• Exponential backoff</li>
							<li>• Linear backoff</li>
							<li>• Custom schedules</li>
						</ul>
					</div>
					<div>
						<h6 className='font-semibold text-blue-800 mb-1'>Circuit Breakers</h6>
						<ul className='text-blue-700 space-y-0.5'>
							<li>• Automatic failure detection</li>
							<li>• Half-open state testing</li>
							<li>• Configurable thresholds</li>
							<li>• Recovery timeouts</li>
						</ul>
					</div>
					<div>
						<h6 className='font-semibold text-blue-800 mb-1'>Advanced Features</h6>
						<ul className='text-blue-700 space-y-0.5'>
							<li>• Conditional retries</li>
							<li>• Jittered delays</li>
							<li>• Retry budgets</li>
							<li>• Composable policies</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	)
}