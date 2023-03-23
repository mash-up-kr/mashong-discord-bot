import { SlashCommandBuilder } from 'discord.js';

export const COMMAND = Symbol('COMMAND');
export const Command = (value: Partial<SlashCommandBuilder>) => {
    const decoratorFactory = (constructor) => {
        Reflect.defineMetadata(COMMAND, value, constructor.prototype);
    };

    return decoratorFactory;
};
