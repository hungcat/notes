export const isDevMode = (() => {
    const nodeEnv = process.env?.NODE_ENV;
    const result = nodeEnv !== "production";

    console.log(
        "[dev mode detection]",
        JSON.stringify(
            {
                nodeEnv,
                result,
            },
            null,
            2
        )
    );

    return result;
})();
