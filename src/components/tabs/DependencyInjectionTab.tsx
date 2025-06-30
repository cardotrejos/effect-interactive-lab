import React from 'react'
import CodeExample from '../shared/CodeExample'
import { effectDependencyInjectionExample, traditionalDependencyInjectionExample } from '../examples/dependencyInjectionExamples'

export default function DependencyInjectionTab(): React.ReactElement {
	return (
		<div className='space-y-4'>
			<div className='text-center text-sm text-gray-600 max-w-3xl mx-auto'>
				Effect's built-in dependency injection system provides type-safe, testable code with zero boilerplate. 
				Services are automatically provided to your program without manual wiring.
			</div>
			
			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-3'>
					<h4 className='text-sm font-semibold text-gray-600 text-center'>Effect Approach</h4>
					
					<CodeExample
						title="Type-Safe Dependency Injection"
						code={effectDependencyInjectionExample}
						isActive={true}
						customStyle={{ fontSize: '12px' }}
					/>
				</div>
				
				<div className='space-y-3'>
					<h4 className='text-sm font-semibold text-gray-600 text-center'>Traditional Approach</h4>
					
					<CodeExample
						title="Manual Dependency Passing"
						code={traditionalDependencyInjectionExample}
						customStyle={{ fontSize: '12px' }}
					/>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-4 text-sm'>
				<div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
					<h5 className='font-semibold text-blue-900 mb-2'>✨ Effect DI Benefits</h5>
					<ul className='text-blue-800 space-y-1.5 text-xs'>
						<li>• Zero boilerplate - services are auto-wired</li>
						<li>• Type-safe - compile-time dependency checking</li>
						<li>• Testable - easy to provide test implementations</li>
						<li>• Composable - services can depend on others</li>
						<li>• Lazy - services created only when needed</li>
						<li>• Scoped - different implementations per context</li>
					</ul>
				</div>
				<div className='bg-gray-50 p-4 rounded-lg border border-gray-300'>
					<h5 className='font-semibold text-gray-900 mb-2'>⚠️ Manual DI Problems</h5>
					<ul className='text-gray-700 space-y-1.5 text-xs'>
						<li>• Services passed through every function</li>
						<li>• Easy to forget dependencies</li>
						<li>• Mocking required for tests</li>
						<li>• Prop drilling through layers</li>
						<li>• No compile-time guarantees</li>
						<li>• Verbose service initialization</li>
					</ul>
				</div>
			</div>
		</div>
	)
}