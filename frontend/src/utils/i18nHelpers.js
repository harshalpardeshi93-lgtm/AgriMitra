export const translateCrop = (crop, t) => {
    if (!crop) return "";
    const key = crop.toLowerCase();
    const trans = t(`crops.${key}`);
    if (trans !== `crops.${key}`) return trans;
    return crop;
};

export const translateRole = (nameWithRole, t) => {
    if (!nameWithRole) return "";

    // Check known exact strings
    const lower = nameWithRole.toLowerCase();
    const exactTrans = t(`roles.${lower.replace(/\s+/g, '_')}`);
    if (exactTrans !== `roles.${lower.replace(/\s+/g, '_')}`) return exactTrans;

    if (lower === "fpo nashik") return t("roles.fpo_nashik");
    if (lower === "verified buyer") return t("roles.verified_buyer");

    // Split and map
    const parts = nameWithRole.split(" ");
    if (parts.length > 1) {
        const potentialRole = parts[parts.length - 1].toLowerCase();
        if (["buyer", "farmer", "fpo", "seller"].includes(potentialRole)) {
            const roleTranslation = t(`roles.${potentialRole}`);
            if (roleTranslation !== `roles.${potentialRole}`) {
                const name = parts.slice(0, -1).join(" ");
                return `${name} ${roleTranslation}`;
            }
        }
    }
    return nameWithRole;
};

export const translateMarket = (marketName, t) => {
    if (!marketName) return "";

    const parts = marketName.split(" ");
    return parts.map(part => {
        // Strip out parentheses if any
        let cleanPart = part.replace(/[()]/g, '');
        let hasOpen = part.includes('(');
        let hasClose = part.includes(')');

        let translation = t(`markets.${cleanPart.toLowerCase()}`);
        if (translation === `markets.${cleanPart.toLowerCase()}`) {
            translation = cleanPart;
        }

        if (hasOpen && hasClose) return `(${translation})`;
        if (hasOpen) return `(${translation}`;
        if (hasClose) return `${translation})`;
        return translation;
    }).join(" ");
};

export const translateUnit = (unit, t) => {
    if (!unit) return "";
    const trans = t(`units.${unit.toLowerCase()}`);
    if (trans !== `units.${unit.toLowerCase()}`) return trans;
    return unit;
};

export const translateStatus = (status, t) => {
    if (!status) return "";
    const key = status.replace(/\s+/g, '_').toLowerCase();

    let trans = t(`dashboard.${key}`);
    if (trans !== `dashboard.${key}`) return trans;

    trans = t(`status.${key}`);
    if (trans !== `status.${key}`) return trans;

    return status;
};

export const translateAdvisorWindow = (windowStr, t) => {
    if (!windowStr) return "";
    const key = windowStr.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase();

    let trans = t(`advisor.windows.${key}`);
    if (trans !== `advisor.windows.${key}`) return trans;

    return windowStr;
};

export const translateRisk = (riskStr, t) => {
    if (!riskStr) return "";

    if (riskStr === 'UNKNOWN') {
        const transUnknown = t('advisor.insufficient_data');
        if (transUnknown !== 'advisor.insufficient_data') return transUnknown;
        return riskStr;
    }

    const key = riskStr.replace(/\s+/g, '_').toLowerCase();

    let trans = t(`advisor.risk_levels.${key}`);
    if (trans !== `advisor.risk_levels.${key}`) return trans;

    return riskStr;
};

export const translateRiskFlag = (flagStr, t) => {
    if (!flagStr) return "";
    const key = `advisor.risk_flags.${flagStr}`;
    const trans = t(key);
    if (trans !== key) return trans;
    return flagStr;
};
