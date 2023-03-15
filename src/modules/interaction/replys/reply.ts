import DiscordInteraction from 'src/domains/discord/interaction';

export interface InteractionReply {
    send(interaction: DiscordInteraction): void;
}
