import { Text } from "@my-ai-orchestrator/ui";
import { sliceContentBlocksForPreview } from "~/content/showcase/format-thread";

export interface ShowcaseThreadPostsProps {
  readonly posts: readonly string[];
  readonly muted?: boolean;
  readonly numbered?: boolean;
  readonly maxPosts?: number;
  readonly lineClamp?: number | false;
  readonly moreBlocksLabel?: string;
}

export function ShowcaseThreadPosts({
  posts,
  muted = false,
  numbered = false,
  maxPosts,
  lineClamp = 3,
  moreBlocksLabel
}: ShowcaseThreadPostsProps) {
  const preview = maxPosts !== undefined ? sliceContentBlocksForPreview(posts, maxPosts) : null;
  const visiblePosts = preview?.visible ?? posts;
  const hiddenCount = preview?.hiddenCount ?? 0;
  const clampClass =
    lineClamp === false
      ? ""
      : lineClamp === 3
        ? "line-clamp-3"
        : lineClamp === 4
          ? "line-clamp-4"
          : `line-clamp-${lineClamp}`;

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {visiblePosts.map((post, index) => (
          <li
            key={`${index + 1}-${post.slice(0, 24)}`}
            className={`border border-showcase-foreground/15 p-3 ${numbered ? "space-y-1" : ""}`}
          >
            {numbered ? (
              <Text
                as="p"
                variant="caption"
                className={muted ? "text-showcase-muted" : "text-showcase-accent"}
              >
                {index + 1}/
              </Text>
            ) : null}
            <Text
              as="p"
              variant="body-lg"
              className={`${clampClass} overflow-hidden text-ellipsis ${
                muted ? "text-showcase-muted" : "text-showcase-foreground"
              }`}
            >
              {post}
            </Text>
          </li>
        ))}
      </ol>
      {hiddenCount > 0 && moreBlocksLabel ? (
        <Text as="p" variant="caption" className="text-showcase-muted">
          {moreBlocksLabel}
        </Text>
      ) : null}
    </div>
  );
}
