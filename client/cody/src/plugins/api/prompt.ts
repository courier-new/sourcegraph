import { Message } from '@sourcegraph/cody-shared/src/sourcegraph-api'

import { IPluginFunctionChosenDescriptor, IPluginFunctionDescriptor } from './types'

export const makePrompt = (question: string, funcs: IPluginFunctionDescriptor[]): Message[] => [
    {
        speaker: 'human',
        text: `Some facts you should know are:
- Today is ${new Date().toISOString()}

Also, I have following functions to call:
\`\`\`json
${JSON.stringify(funcs, null, 2)}
\`\`\`

Choose up to 3 functions that you want to call to properly answer my question. Respond in a only json format like this, example:
\`\`\`json
${JSON.stringify(
    [
        {
            name: 'function_name',
            parameters: {
                parameter_name: 'parameter_value',
            },
        },
    ] as IPluginFunctionChosenDescriptor[],
    null,
    2
)}
\`\`\`

If no additional function call is needed respond with empty JSON array, like this:
\`\`\`json
[]
\`\`\`

Order array elements by priority, the first element is the most important one.

My question is:

${JSON.stringify(question)}
`,
    },
    {
        speaker: 'assistant',
    },
]
