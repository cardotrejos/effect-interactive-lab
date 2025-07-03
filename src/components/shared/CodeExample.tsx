import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import clsx from 'clsx'
import type { CodeExampleProps } from '../../types/dashboard'

export default function CodeExample({ 
	title, 
	code, 
	language = 'typescript', 
	isActive = false,
	customStyle = {}
}: CodeExampleProps): React.ReactElement {
	return (
		<div className={clsx(
			'rounded-lg p-4 border-2 transition-all',
			isActive
				? 'bg-gray-900 border-blue-500 shadow-lg shadow-blue-500/20' 
				: 'bg-gray-900 border-gray-700'
		)}>
			<h3 className='text-white font-semibold mb-2 text-sm flex items-center gap-2'>
				{title}
				{isActive && <span className='text-xs bg-blue-500 px-2 py-0.5 rounded'>ACTIVE</span>}
			</h3>
			<SyntaxHighlighter 
				language={language} 
				style={vscDarkPlus}
				customStyle={{ 
					fontSize: '11px', 
					margin: 0, 
					background: 'transparent',
					...customStyle
				}}
			>
				{code}
			</SyntaxHighlighter>
		</div>
	)
}