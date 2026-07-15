// LEGAL: ESLint custom rule to enforce comment policy
// COMPLIANCE: Only comments starting with // LEGAL:, // TODO:, or // COMPLIANCE: are allowed
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow disallowed comments",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      disallowed: "Disallowed comment. Use only // LEGAL:, // TODO:, or // COMPLIANCE:.",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();
    const allowedPrefixes = ["// LEGAL:", "// TODO:", "// COMPLIANCE:"];
    comments.forEach((comment) => {
      const value = comment.value.trim();
      const raw = comment.type === "Line" ? "// " + value : "/* " + value + " */";
      const isAllowed = allowedPrefixes.some((p) => raw.startsWith(p));
      if (!isAllowed) {
        context.report({ node: comment, messageId: "disallowed" });
      }
    });
    return {};
  },
};
