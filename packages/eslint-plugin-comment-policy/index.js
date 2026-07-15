// LEGAL: eslint-plugin-comment-policy

/**
 * ESLint rule that enforces comments to start with one of the allowed prefixes:
 *   // LEGAL:
 *   // TODO:
 *   // COMPLIANCE:
 * Any other comment pattern will raise an error.
 */
module.exports = {
  rules: {
    enforce: {
      meta: {
        type: "problem",
        docs: {
          description: "enforce comment policy (only LEGAL, TODO, COMPLIANCE prefixes)",
          category: "Stylistic Issues",
          recommended: true,
        },
        schema: [],
        messages: {
          invalid: "Comment does not comply with policy. Allowed prefixes: // LEGAL:, // TODO:, // COMPLIANCE:" ,
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();
        return {
          Program() {
            const comments = sourceCode.getAllComments();
            for (const comment of comments) {
              // LEGAL: Only line comments (// ...)
              if (comment.type !== "Line") continue;
              const text = comment.value.trim();
              if (
                !(
                  text.startsWith("LEGAL:") ||
                  text.startsWith("TODO:") ||
                  text.startsWith("COMPLIANCE:")
                )
              ) {
                context.report({
                  node: comment,
                  messageId: "invalid",
                });
              }
            }
          },
        };
      },
    },
  },
};
