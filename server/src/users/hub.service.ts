import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HubService {
    private readonly logger = new Logger(HubService.name);
    private readonly hubApiUrl: string;
    private readonly hubApiKey: string;
    private readonly instanceId: string;
    private readonly isConfigured: boolean;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.hubApiUrl = this.configService.get<string>('HUB_API_URL');
        this.hubApiKey = this.configService.get<string>('HUB_API_KEY');
        this.instanceId = this.configService.get<string>('INSTANCE_ID');

        this.isConfigured =
            Boolean(this.hubApiUrl && this.hubApiKey && this.instanceId) &&
            !this.hubApiKey?.includes('your-hub-api-key') &&
            this.hubApiUrl !== 'https://hub.recover.com' &&
            !this.instanceId?.includes('your-instance-id');

        if (!this.isConfigured) {
            this.logger.warn(
                'Hub API is not correctly configured (possibly using placeholders). Functional Hub sync is disabled.',
            );
        }
    }

    /**
     * Check if Hub is functional
     */
    public isHubConfigured(): boolean {
        return this.isConfigured;
    }

    /**
     * Fetch balance and credits for an admin from the Hub
     * @param email Admin email address
     * @returns Balance (₹) and credits (usage units)
     */
    async getBalance(email: string): Promise<{ balance: number; credits: number; costPerMinute: number }> {
        if (!this.isConfigured) {
            throw new Error('Hub API not configured');
        }
        const startTime = Date.now();
        try {
            this.logger.log(`[HUB_SYNC] Fetching balance for ${email}...`);

            const response = await firstValueFrom(
                this.httpService.get(`${this.hubApiUrl}/api/v1/external/balance/${email}`, {
                    headers: {
                        'x-hub-key': this.hubApiKey,
                    },
                }),
            );

            const duration = Date.now() - startTime;
            this.logger.log(
                `[HUB_SYNC] Balance fetch for ${email}: ₹${response.data.balance}, ${response.data.credits} credits, rate: ₹${response.data.costPerMinute}/min (${duration}ms)`,
            );

            return {
                balance: parseFloat(response.data.balance),
                credits: Number(response.data.credits),
                costPerMinute: parseFloat(response.data.costPerMinute || 0),
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(
                `[HUB_ERROR] Balance fetch failed for ${email}: ${error.message} (${duration}ms)`,
            );
            throw error;
        }
    }

    /**
     * Add credits to Hub after successful payment
     * @param email Admin email
     * @param amount Amount to add (₹)
     * @param description Transaction description
     * @param externalReference Payment reference (txnid)
     */
    async addCredits(
        email: string,
        amount: number,
        credits: number,
        description: string,
        externalReference: string,
    ): Promise<any> {
        if (!this.isConfigured) return { success: true, message: 'Hub not configured, local only' };

        this.logger.log(
            `[HUB_SYNC] Payment sync: +₹${amount} (${credits} credits) for ${email}, ref: ${externalReference}, desc: "${description}"`,
        );

        try {
            const payload = {
                email,
                amount,
                credits,
                description,
                externalReference,
            };

            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.hubApiUrl}/api/v1/external/add-credits`,
                    payload,
                    {
                        headers: {
                            'x-hub-key': this.hubApiKey,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            this.logger.log(
                `[HUB_SYNC] Payment sync successful for ${email}: New balance ₹${response.data.newBalance || 'N/A'}`,
            );

            return response.data;
        } catch (error) {
            this.logger.error(
                `[HUB_ERROR] Payment sync failed for ${email}: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Deduct credits from Hub when provisioning sub-users
     * @param email Admin email
     * @param amount Amount to deduct (₹)
     * @param description Transaction description
     */
    async deductCredits(
        email: string,
        amount: number,
        credits: number,
        description: string,
    ): Promise<any> {
        if (!this.isConfigured) return { success: true, message: 'Hub not configured, local only' };

        this.logger.log(
            `[HUB_SYNC] Credit deduction: -₹${amount} (-${credits} credits) for ${email}, desc: "${description}"`,
        );

        try {
            const payload = {
                email,
                amount,
                credits,
                description,
            };

            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.hubApiUrl}/api/v1/external/deduct-credits`,
                    payload,
                    {
                        headers: {
                            'x-hub-key': this.hubApiKey,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            this.logger.log(
                `[HUB_SYNC] Credit deduction successful for ${email}: New balance ₹${response.data.newBalance || 'N/A'}`,
            );

            return response.data;
        } catch (error) {
            this.logger.error(
                `[HUB_ERROR] Credit deduction failed for ${email}: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Validate admin credentials with Hub
     * @param email Admin email
     * @param password Admin password
     * @returns Admin data from Hub
     */
    async validateAdmin(
        email: string,
        password: string,
    ): Promise<{
        email: string;
        credits: number;
        balance: number;
        costPerMinute: number;
    }> {
        if (!this.isConfigured) {
            throw new Error('Hub API not configured');
        }
        this.logger.log(`[HUB_SYNC] Validating admin credentials for ${email}...`);

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.hubApiUrl}/api/v1/external/validate-admin`,
                    { email, password },
                    {
                        headers: {
                            'x-hub-key': this.hubApiKey,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            this.logger.log(`[HUB_SYNC] Admin validation successful for ${email}`);

            return {
                email: response.data.email,
                credits: Number(response.data.credits),
                balance: parseFloat(response.data.balance),
                costPerMinute: parseFloat(response.data.costPerMinute || 0),
            };
        } catch (error) {
            this.logger.error(
                `[HUB_ERROR] Admin validation failed for ${email}: ${error.message}`,
            );
            throw error;
        }
    }
}
