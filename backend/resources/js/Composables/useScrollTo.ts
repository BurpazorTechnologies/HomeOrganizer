export const useScrollTo = () => {
    const scrollToElement = (elementId: string, behavior: ScrollBehavior = 'smooth') => {
        document.getElementById(elementId)?.scrollIntoView({ behavior });
    };

    return {
        scrollToElement
    };
}; 