import React from 'react'
import CodeExample from '../shared/CodeExample'
import { effectErrorHandlingExample, traditionalErrorHandlingExample } from '../examples/errorHandlingExamples'

export default function ErrorHandlingTab(): React.ReactElement {
	return (
		<div className='space-y-4'>
			<div className='text-center text-sm text-gray-600 max-w-3xl mx-auto'>
				Effect provides comprehensive error handling with automatic recovery, typed errors, and built-in timeout support. 
				Compare this to the manual, error-prone approach required with async/await.
			</div>
			
			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-3'>
					<h4 className='text-sm font-semibold text-gray-600 text-center'>Effect Approach</h4>
					
					<CodeExample
						title="Declarative Error Handling"
						code={effectErrorHandlingExample}
						isActive={true}
						customStyle={{ fontSize: '12px' }}
					/>
				</div>
				
				<div className='space-y-3'>
					<h4 className='text-sm font-semibold text-gray-600 text-center'>Traditional Async/Await</h4>
					
					<CodeExample
						title="Manual Error Handling"
						code={traditionalErrorHandlingExample}
						customStyle={{ fontSize: '12px' }}
					/>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-4 text-sm'>
				<div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
					<h5 className='font-semibold text-blue-900 mb-2'>✨ Effect Error Handling</h5>
					<ul className='text-blue-800 space-y-1.5 text-xs'>
						<li>• Typed errors - know what can fail at compile time</li>
						<li>• Automatic error propagation</li>
						<li>• Built-in timeout support</li>
						<li>• Declarative retry strategies</li>
						<li>• Error recovery with fallbacks</li>
						<li>• Structured error messages</li>
					</ul>
				</div>
				<div className='bg-gray-50 p-4 rounded-lg border border-gray-300'>
					<h5 className='font-semibold text-gray-900 mb-2'>⚠️ Async/Await Challenges</h5>
					<ul className='text-gray-700 space-y-1.5 text-xs'>
						<li>• Untyped errors - anything can throw</li>
						<li>• Manual error catching everywhere</li>
						<li>• Complex timeout implementation</li>
						<li>• Retry logic must be hand-rolled</li>
						<li>• Easy to miss error cases</li>
						<li>• Verbose error handling code</li>
					</ul>
				</div>
			</div>
		</div>
	)
}