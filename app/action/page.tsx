import { sql } from '@/app/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function ActionPage() {
  async function createComment(formData: FormData) {
    'use server';
    const comment = formData.get('comment') as string;
    await sql`INSERT INTO comments (comment) VALUES (${comment})`;
    revalidatePath('/action');
  }

  async function getComments() {
    await sql`CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, comment TEXT)`;
    const comments = await sql<{ id: number; comment: string }[]>`SELECT * FROM comments`;
    return comments;
  }

  return (
    <div className="min-h-screen p-10 font-sans">
      <h2 className="text-2xl font-semibold">Server Action Example</h2>
      <form action={createComment} className="mt-6 flex gap-3">
        <input
          type="text"
          name="comment"
          placeholder="Add a comment"
          className="rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Submit
        </button>
      </form>
      <h3 className="mt-8 text-xl font-medium">Comments:</h3>
      <ul className="mt-3 list-disc pl-6">
        {await getComments().then((comments) =>
          comments.map((c) => <li key={c.id}>{c.comment}</li>)
        )}
      </ul>
    </div>
  );
}
