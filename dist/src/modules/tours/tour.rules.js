"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBaseTourRules = validateBaseTourRules;
function validateBaseTourRules(input) {
    const { type, durationDays, capacityMode } = input;
    if (type === 'DAY' && durationDays && durationDays > 1) {
        throw new Error('Invalid duration for day tour');
    }
    if (type === 'PACKAGE' && durationDays && durationDays <= 1) {
        throw new Error('Invalid duration for package tour');
    }
    if (!['EXCLUSIVE', 'SHARED', 'MIXED'].includes(capacityMode)) {
        throw new Error('Invalid capacity mode');
    }
}
