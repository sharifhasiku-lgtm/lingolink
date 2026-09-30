import type { BciConfig, ResolveContext } from '../../../schemas/index.js';
export declare function resolveBciConfig(cfg: BciConfig, ctx: ResolveContext): Promise<{
    config: {
        whisperConfig?: {
            language?: string | undefined;
            n_threads?: number | undefined;
            temperature?: number | undefined;
            suppress_nst?: boolean | undefined;
            suppress_blank?: boolean | undefined;
            duration_ms?: number | undefined;
            translate?: boolean | undefined;
            no_timestamps?: boolean | undefined;
            single_segment?: boolean | undefined;
            print_special?: boolean | undefined;
            print_progress?: boolean | undefined;
            print_realtime?: boolean | undefined;
            print_timestamps?: boolean | undefined;
            detect_language?: boolean | undefined;
            greedy_best_of?: number | undefined;
            beam_search_beam_size?: number | undefined;
        } | undefined;
        bciConfig?: {
            day_idx?: number | undefined;
        } | undefined;
        contextParams?: {
            model?: string | undefined;
            use_gpu?: boolean | undefined;
            flash_attn?: boolean | undefined;
            gpu_device?: number | undefined;
        } | undefined;
        miscConfig?: {
            caption_enabled?: boolean | undefined;
        } | undefined;
        backendsDir?: string | undefined;
    };
    artifacts?: never;
} | {
    config: {
        whisperConfig?: {
            language?: string | undefined;
            n_threads?: number | undefined;
            temperature?: number | undefined;
            suppress_nst?: boolean | undefined;
            suppress_blank?: boolean | undefined;
            duration_ms?: number | undefined;
            translate?: boolean | undefined;
            no_timestamps?: boolean | undefined;
            single_segment?: boolean | undefined;
            print_special?: boolean | undefined;
            print_progress?: boolean | undefined;
            print_realtime?: boolean | undefined;
            print_timestamps?: boolean | undefined;
            detect_language?: boolean | undefined;
            greedy_best_of?: number | undefined;
            beam_search_beam_size?: number | undefined;
        } | undefined;
        bciConfig?: {
            day_idx?: number | undefined;
        } | undefined;
        contextParams?: {
            model?: string | undefined;
            use_gpu?: boolean | undefined;
            flash_attn?: boolean | undefined;
            gpu_device?: number | undefined;
        } | undefined;
        miscConfig?: {
            caption_enabled?: boolean | undefined;
        } | undefined;
        backendsDir?: string | undefined;
    };
    artifacts: {
        embedderPath: string;
    };
}>;
