import { z } from 'zod';

const propertiesSchema = z.object({
  listId: z.string().uuid().describe('The SharePoint list ID containing access reviews.'),
  query: z.string().max(120).optional().describe('Optional title or status to find in the list.')
});

export type IAccessReviewCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default z.toJSONSchema(propertiesSchema, { target: 'draft-7' });
