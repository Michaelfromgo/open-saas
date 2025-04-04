// PRIVATE API
// Formats an email address and an optional name into a string that can be used
// as the "from" field in an email.
// { email: "test@test.com, name: "Test" } -> "Test <test@test.com>"
export function formatFromField({ email, name, }) {
    if (name) {
        return `${name} <${email}>`;
    }
    return email;
}
// PRIVATE API
export function getDefaultFromField() {
    return {
        email: "michael682682@gmail.com",
        name: "Open SaaS App",
    };
}
//# sourceMappingURL=helpers.js.map