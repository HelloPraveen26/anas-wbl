import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from "typeorm";
import { Assistant } from "./assistant.entity";

@Entity("tool_configs")
@Unique(["assistantId", "toolName"])
export class ToolConfig {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "assistant_id", type: "uuid" })
    @Index()
    assistantId: string;

    @Column({ name: "tool_name", length: 255 })
    toolName: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ name: "webhook_url", type: "text" })
    webhookUrl: string;

    @Column({ type: "integer", default: 20 })
    timeout: number;

    @Column({ name: "is_async", default: true })
    isAsync: boolean;

    @Column({ name: "is_strict", default: true })
    isStrict: boolean;

    @Column({ type: "jsonb", default: {} })
    parameters: Record<string, any>;

    @Column({ name: "http_headers", type: "jsonb", default: {} })
    httpHeaders: Record<string, any>;

    @Column({ type: "jsonb", default: [] })
    conditions: any[];

    @ManyToOne("Assistant", (assistant: any) => assistant.toolConfigs, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "assistant_id" })
    assistant: any;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
