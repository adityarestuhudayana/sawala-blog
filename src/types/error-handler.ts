export interface ErrorHandler extends Error {
    statusCode?: number
}