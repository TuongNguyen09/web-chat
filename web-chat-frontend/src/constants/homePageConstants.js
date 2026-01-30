// ============================================================================
// HOME PAGE CONSTANTS
// ============================================================================

export const PAGE_SIZE = 20;
export const MIN_FETCH_DURATION = 1000;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length !== 2) return undefined;
    return parts.pop().split(";").shift();
};
