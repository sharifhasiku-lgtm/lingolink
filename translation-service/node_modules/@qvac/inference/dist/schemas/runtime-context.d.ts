import { z } from 'zod';
export declare const runtimeContextSchema: z.ZodObject<{
    runtime: z.ZodOptional<z.ZodEnum<{
        node: "node";
        bare: "bare";
        "react-native": "react-native";
    }>>;
    platform: z.ZodOptional<z.ZodEnum<{
        android: "android";
        ios: "ios";
        darwin: "darwin";
        linux: "linux";
        win32: "win32";
    }>>;
    deviceModel: z.ZodOptional<z.ZodString>;
    deviceBrand: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RuntimeContext = z.infer<typeof runtimeContextSchema>;
