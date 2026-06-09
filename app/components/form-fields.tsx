"use client";

import type { ChangeEvent, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FieldWrapperProps {
	label: string;
	children: ReactNode;
	error?: string;
	span?: "full";
	className?: string;
}

export function FieldWrapper({ label, children, error, span, className = "" }: FieldWrapperProps) {
	return (
		<div className={`grid gap-2 text-sm font-semibold text-[var(--ink)] ${span === "full" ? "md:col-span-2" : ""} ${className}`}>
			<Label>{label}</Label>
			{children}
			{error && <p className="text-xs text-red-500">{error}</p>}
		</div>
	);
}

export function TextField({
	label,
	value,
	onChange,
	placeholder,
	error,
	span,
	type = "text",
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	span?: "full";
	type?: string;
}) {
	return (
		<FieldWrapper label={label} error={error} span={span}>
			<Input
				type={type}
				value={value}
				onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
				placeholder={placeholder}
				className="h-10 border-[var(--line)] bg-white text-sm font-normal text-[var(--ink)]"
			/>
		</FieldWrapper>
	);
}

export function TextareaField({
	label,
	value,
	onChange,
	placeholder,
	error,
	span,
	rows = 3,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	span?: "full";
	rows?: number;
}) {
	return (
		<FieldWrapper label={label} error={error} span={span}>
			<Textarea
				value={value}
				onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
				placeholder={placeholder}
				rows={rows}
				className="resize-y border-[var(--line)] bg-white text-sm font-normal text-[var(--ink)]"
			/>
		</FieldWrapper>
	);
}

export function SelectField({
	label,
	value,
	onChange,
	options,
	placeholder,
	error,
	span,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	placeholder?: string;
	error?: string;
	span?: "full";
}) {
	return (
		<FieldWrapper label={label} error={error} span={span}>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="h-10 border-[var(--line)] bg-white text-sm font-normal text-[var(--ink)]">
					<SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}`} />
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FieldWrapper>
	);
}

export function SwitchField({
	label,
	checked,
	onChange,
	error,
	span,
}: {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	error?: string;
	span?: "full";
}) {
	return (
		<FieldWrapper label={label} error={error} span={span}>
			<Switch checked={checked} onCheckedChange={onChange} />
		</FieldWrapper>
	);
}

export function NumericField({
	label,
	value,
	onChange,
	placeholder,
	error,
	span,
	min,
	step,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	span?: "full";
	min?: number;
	step?: number;
}) {
	return (
		<FieldWrapper label={label} error={error} span={span}>
			<Input
				type="number"
				value={value}
				onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
				placeholder={placeholder}
				min={min}
				step={step}
				className="h-10 border-[var(--line)] bg-white text-sm font-normal text-[var(--ink)]"
			/>
		</FieldWrapper>
	);
}

export function DateField({
  label,
  value,
  onChange,
  error,
  span,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  span?: "full";
}) {
  return (
    <FieldWrapper label={label} error={error} span={span}>
      <Input
        type="date"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="h-11 border-[var(--line)] bg-white text-sm font-normal text-[var(--ink)]"
      />
    </FieldWrapper>
  );
}
