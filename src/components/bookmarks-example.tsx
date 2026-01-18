import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function BookmarksList() {
  const bookmarks = useQuery(api.bookmarks.list);

  return (
    <div>
      <h1>Bookmarks</h1>
      {bookmarks === undefined ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {bookmarks.map((bookmark) => (
            <li key={bookmark._id}>
              <a href={bookmark.url}>{bookmark.title}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
