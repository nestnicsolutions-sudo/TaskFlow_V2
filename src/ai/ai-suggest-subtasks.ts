// src/ai/ai-suggest-subtasks.ts
'use server';
/**
 * @fileOverview An AI tool to suggest subtasks based on the project description and existing tasks.
 *
 * - suggestSubtasks - A function that handles the subtask suggestion process.
 * - SuggestSubtasksInput - The input type for the suggestSubtasks function.
 * - SuggestSubtasksOutput - The return type for the suggestSubtasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSubtasksInputSchema = z.object({
  projectDescription: z.string().describe('The description of the project.'),
  existingTasks: z.array(z.string()).describe('The list of existing tasks in the project.'),
});
export type SuggestSubtasksInput = z.infer<typeof SuggestSubtasksInputSchema>;

const SuggestSubtasksOutputSchema = z.object({
  subtasks: z.array(z.string()).describe('The list of suggested subtasks.'),
});
export type SuggestSubtasksOutput = z.infer<typeof SuggestSubtasksOutputSchema>;

export async function suggestSubtasks(input: SuggestSubtasksInput): Promise<SuggestSubtasksOutput> {
  return suggestSubtasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSubtasksPrompt',
  input: {schema: SuggestSubtasksInputSchema},
  output: {schema: SuggestSubtasksOutputSchema},
  prompt: `You are a project management assistant. Your task is to suggest subtasks for a given project, based on the project description and the existing tasks.

Project Description: {{{projectDescription}}}

Existing Tasks:
{{#each existingTasks}}
- {{{this}}}
{{/each}}

Suggest 5-10 subtasks that would help in completing the project. Be specific and actionable.

Output the subtasks as a list of strings in the subtasks field.`, 
});

const suggestSubtasksFlow = ai.defineFlow(
  {
    name: 'suggestSubtasksFlow',
    inputSchema: SuggestSubtasksInputSchema,
    outputSchema: SuggestSubtasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
