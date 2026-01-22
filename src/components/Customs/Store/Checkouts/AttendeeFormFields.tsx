"use client";
import { useState } from "react";
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Facebook,
  Instagram,
  Linkedin,
  Send,
  Twitter,
  CircleXIcon,
  Loader2,
  ChevronsUpDown,
} from "lucide-react";
import { AttendeeFormValues } from "@/schema/store/attendee.schema";
import { DEFAULT_CUSTOM_QUESTIONS } from "@/constants/store/attendee.constants";
import { useNetworkingOptions } from "@/hooks/Store/Checkouts/useNetworkingOptions";
import { useHearAboutOptions } from "@/hooks/Store/Checkouts/useHearAboutOptions";
import { useCompanyPositionOptions } from "@/hooks/Store/Checkouts/useCompanyPositionOptions";
import { useCompanyFocusOptions } from "@/hooks/Store/Checkouts/useCompanyFocusOptions";
import { useCompanySizeOptions } from "@/hooks/Store/Checkouts/useCompanySizeOptions";

// @types(props)
type AttendeeFormFieldsProps = {
  control: Control<AttendeeFormValues>;
  index: number;
  isSubmitting: boolean;
  isWorking: boolean;
  watch: UseFormWatch<AttendeeFormValues>;
  setValue: UseFormSetValue<AttendeeFormValues>;
};

export default function AttendeeFormFields({
  control,
  index,
  isSubmitting,
  isWorking,
  watch,
  setValue,
}: AttendeeFormFieldsProps) {
  // @field(forms)
  const {
    data: isNetworkingOptions = [],
    isLoading: isNetworkingLoadingOptions,
    error: isNetworkingOptionsError,
  } = useNetworkingOptions();
  const {
    data: isHearAboutOptions = [],
    isLoading: isHearAboutLoadingOptions,
    error: isHearAboutOptionsError,
  } = useHearAboutOptions();
  const {
    data: isCompanyPositionOptions = [],
    isLoading: isCompanyPositionLoadingOptions,
    error: isCompanyPositionOptionsError,
  } = useCompanyPositionOptions();
  const {
    data: isCompanyFocusOptions = [],
    isLoading: isCompanyFocusLoadingOptions,
    error: isCompanyFocusOptionsError,
  } = useCompanyFocusOptions();
  const {
    data: isCompanySizeOptions = [],
    isLoading: isCompanyLoadingOptions,
    error: isCompanyOptionsError,
  } = useCompanySizeOptions();

  // @state(position combobox)
  const [positionComboboxOpen, setPositionComboboxOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState("");
  const [focusComboboxOpen, setFocusComboboxOpen] = useState(false);
  const [focusSearch, setFocusSearch] = useState("");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* @field(first_name) */}
      <FormField
        control={control}
        name={`attendees.${index}.first_name`}
        render={({ field }) => (
          <FormItem className="flex flex-col items-start">
            <FormLabel>{`First name`}</FormLabel>
            <FormControl>
              <Input
                className="py-3 px-4 block h-auto w-full"
                placeholder=""
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* @field(last_name) */}
      <FormField
        control={control}
        name={`attendees.${index}.last_name`}
        render={({ field }) => (
          <FormItem className="flex flex-col items-start">
            <FormLabel>{`Last name`}</FormLabel>
            <FormControl>
              <Input
                className="py-3 px-4 block h-auto w-full"
                placeholder=""
                {...field}
                value={field?.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* @field(email) */}
      <FormField
        control={control}
        name={`attendees.${index}.email`}
        render={({ field }) => (
          <FormItem className="flex flex-col items-start">
            <div className="flex flex-row items-start justify-between w-full">
              <FormLabel>{`Email`}</FormLabel>
              <span className="text-sm text-muted-foreground">{`Enter the attendee's correct email to avoid issues!`}</span>
            </div>
            <FormControl>
              <Input
                className="py-3 px-4 block h-auto w-full"
                type="email"
                placeholder=""
                {...field}
                value={field?.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* @field(country) */}
      <FormField
        control={control}
        name={`attendees.${index}.country`}
        render={({ field }) => (
          <FormItem className="flex flex-col items-start">
            <FormLabel>{`Country`}</FormLabel>
            <FormControl>
              <Input
                className="py-3 px-4 block h-auto w-full"
                placeholder="Enter country"
                {...field}
                value={field?.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* @field(social_accounts) */}
      <FormField
        control={control}
        name={`attendees.${index}.social_accounts`}
        render={({ field }) => (
          <FormItem className="col-span-full flex flex-col items-start">
            <div className="flex items-center justify-between w-full">
              <FormLabel>{`Social Accounts`}</FormLabel>
              <Button
                className="text-xs h-auto w-auto py-1.5 px-2.5 font-medium gap-x-1 leading-[initial]"
                type="button"
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  const current = field?.value || [];
                  if (current?.length >= 5) return;
                  field.onChange([
                    ...current,
                    {
                      socialmedia: "telegram",
                      accounts: "" as string,
                    },
                  ]);
                }}
                disabled={isSubmitting || (field?.value?.length || 0) >= 5}
              >
                {`Add Links`}
              </Button>
            </div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
              {(field?.value || [])?.map((account, accountIndex) => {
                const accounts =
                  field?.value?.length && field?.value.length > 0
                    ? field?.value
                    : [];
                return (
                  <div
                    key={accountIndex}
                    className="flex gap-2 items-start p-0 rounded-lg relative"
                  >
                    <FormField
                      control={control}
                      name={`attendees.${index}.social_accounts.${accountIndex}.socialmedia`}
                      render={({ field: socialmediaField }) => (
                        <FormItem className="flex-1 absolute left-1 top-1">
                          <FormControl>
                            <Select
                              value={
                                socialmediaField.value ??
                                account?.socialmedia ??
                                "telegram"
                              }
                              onValueChange={(value) => {
                                socialmediaField.onChange(value);
                                const updated = [...accounts];
                                updated[accountIndex] = {
                                  ...account,
                                  socialmedia: value,
                                  accounts: account?.accounts || "",
                                };
                                field.onChange(updated);
                              }}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className="py-2.25 bg-primary text-white text-sm font-medium w-[67px]">
                                <SelectValue
                                  className="text-white"
                                  placeholder="Select Social Media"
                                />
                              </SelectTrigger>
                              <SelectContent align="start" side="top">
                                <SelectItem value="telegram">
                                  <span className="flex items-center gap-1.5">
                                    <Send className="size-4 text-current mr-0.5" />
                                    Telegram
                                  </span>
                                </SelectItem>
                                <SelectItem value="twitter">
                                  <span className="flex items-center gap-1.5">
                                    <Twitter className="size-4 text-current mr-0.5" />
                                    Twitter
                                  </span>
                                </SelectItem>
                                <SelectItem value="instagram">
                                  <span className="flex items-center gap-1.5">
                                    <Instagram className="size-4 text-current mr-0.5" />
                                    Instagram
                                  </span>
                                </SelectItem>
                                <SelectItem value="facebook">
                                  <span className="flex items-center gap-1.5">
                                    <Facebook className="size-4 text-current mr-0.5" />
                                    Facebook
                                  </span>
                                </SelectItem>
                                <SelectItem value="linkedin">
                                  <span className="flex items-center gap-1.5">
                                    <Linkedin className="size-4 text-current mr-0.5" />
                                    LinkedIn
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`attendees.${index}.social_accounts.${accountIndex}.accounts`}
                      render={({ field: accountsField }) => (
                        <FormItem className="flex-2">
                          <FormControl>
                            <Input
                              className="h-12 pl-20 w-full rounded-lg"
                              placeholder="Enter social media accounts"
                              value={accountsField.value ?? account?.accounts}
                              onChange={(e) => {
                                accountsField.onChange(e.target.value);
                                const updated = [...accounts];
                                updated[accountIndex] = {
                                  socialmedia: account?.socialmedia,
                                  accounts: e.target.value || "",
                                };
                                field.onChange(updated);
                              }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant={"ghost"}
                      size="sm"
                      onClick={() => {
                        const updated = [...accounts];
                        updated.splice(accountIndex, 1);
                        field.onChange(updated);
                      }}
                      disabled={isSubmitting}
                      className="h-10 bg-transparent hover:bg-transparent absolute right-1 top-1 p-0"
                    >
                      <CircleXIcon className="size-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
              {(!field?.value || field?.value.length === 0) && (
                <p className="col-span-full text-sm py-4 px-4 text-center border-2 rounded-xl border-dashed border-primary/50 text-primary font-semibold text-balance">
                  {`No social accounts linked. Click “Add” to connect one.`}
                </p>
              )}
            </div>
          </FormItem>
        )}
      />

      {/* @field(custom_questions) */}
      <FormField
        control={control}
        name={`attendees.${index}.custom_questions.${0}.answer`}
        render={({ field }) => (
          <FormItem className="col-span-full flex flex-col items-start">
            <FormLabel>{DEFAULT_CUSTOM_QUESTIONS[0]}</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isSubmitting}
            >
              <FormControl>
                <SelectTrigger className="py-3 px-4 h-auto w-full">
                  <SelectValue placeholder="I want to meet ..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent align="start" side="top" className="py-0.5 px-0.5">
                {isNetworkingLoadingOptions ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                ) : isNetworkingOptionsError ? (
                  <div className="py-2 px-3 text-sm text-destructive">
                    {`Failed to load options. Using defaults.`}
                  </div>
                ) : isNetworkingOptions?.length > 0 ? (
                  isNetworkingOptions?.map((option) => (
                    <SelectItem key={option?.value} value={option?.value}>
                      {option?.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="N/A">N/A</SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`attendees.${index}.custom_questions.${1}.answer`}
        render={({ field }) => (
          <FormItem className="col-span-full flex flex-col items-start">
            <FormLabel>{DEFAULT_CUSTOM_QUESTIONS[1]}</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isSubmitting}
            >
              <FormControl>
                <SelectTrigger className="py-3 px-4 h-auto w-full">
                  <SelectValue placeholder="Heard from..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent align="start" side="top" className="py-0.5 px-0.5">
                {isHearAboutLoadingOptions ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                ) : isHearAboutOptionsError ? (
                  <div className="py-2 px-3 text-sm text-destructive">
                    {`Failed to load options. Using defaults.`}
                  </div>
                ) : isHearAboutOptions?.length > 0 ? (
                  isHearAboutOptions?.map((option) => (
                    <SelectItem key={option?.value} value={option?.value}>
                      {option?.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="N/A">N/A</SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* @field(is_working_with_company) */}
      <FormField
        control={control}
        name={`attendees.${index}.is_working_with_company`}
        render={({ field }) => (
          <FormItem className="col-span-full flex flex-row items-center justify-between space-x-3">
            <FormLabel className="leading-[initial]">
              <span className="flex flex-col items-start justify-start space-y-1">
                <span>{`Are you working with a company?`}</span>
                <span className="font-normal text-muted-foreground">
                  {`Use the company details that correspond with the attendee!`}
                </span>
              </span>
            </FormLabel>
            <FormControl>
              <Switch
                className="m-0"
                checked={!!field?.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);

                  setValue(
                    `attendees.${index}.company_name`,
                    !checked ? "N/A" : "",
                    {
                      shouldValidate: true,
                    }
                  );
                  setValue(
                    `attendees.${index}.company_website`,
                    !checked ? "N/A" : "",
                    { shouldValidate: true }
                  );
                  setValue(
                    `attendees.${index}.position`,
                    !checked ? "N/A" : "",
                    {
                      shouldValidate: true,
                    }
                  );
                  setValue(
                    `attendees.${index}.company_focus`,
                    !checked ? "N/A" : "",
                    { shouldValidate: true }
                  );
                  setValue(
                    `attendees.${index}.company_size`,
                    !checked ? "N/A" : "",
                    {
                      shouldValidate: true,
                    }
                  );
                }}
                disabled={isSubmitting}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* @field(company_name) */}
      <FormField
        control={control}
        name={`attendees.${index}.company_name`}
        render={({ field }) => (
          <FormItem className="col-span-full flex flex-col items-start">
            <FormLabel>{`Company Name`}</FormLabel>
            <FormControl>
              <Input
                className="py-3 px-4 block h-auto w-full"
                placeholder=""
                {...field}
                value={field?.value || ""}
                disabled={isSubmitting || !isWorking}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* @company(fields) */}
      {isWorking ? (
        <>
          {/* @field(company_website) */}
          <FormField
            control={control}
            name={`attendees.${index}.company_website`}
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <div className="flex items-center justify-between w-full mb-1">
                  <FormLabel>{`Company Website`}</FormLabel>
                </div>
                <FormControl>
                  <Input
                    className="py-3 px-4 block h-auto w-full"
                    type="url"
                    placeholder="(https://website.com)"
                    {...field}
                    value={field?.value || ""}
                    disabled={isSubmitting || !isWorking}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* @field(position) */}
          <FormField
            control={control}
            name={`attendees.${index}.position`}
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <FormLabel>{`Position`}</FormLabel>
                <DropdownMenu
                  open={positionComboboxOpen}
                  onOpenChange={setPositionComboboxOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={positionComboboxOpen}
                        className="w-full justify-between py-3.25 px-4 h-auto font-normal"
                        disabled={isSubmitting}
                      >
                        {field?.value && field?.value !== "N/A"
                          ? isCompanyPositionOptions?.find(
                              (option) => option?.value === field?.value
                            )?.label || field?.value
                          : "Select position..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="p-0"
                    align="start"
                    style={{
                      width: "var(--radix-dropdown-menu-trigger-width)",
                    }}
                  >
                    <Command
                      shouldFilter={false}
                      className="rounded-lg border-none"
                    >
                      <CommandInput
                        placeholder="Search positions..."
                        value={positionSearch}
                        onValueChange={setPositionSearch}
                      />
                      <CommandList className="max-h-[200px] scrollbar overflow-y-auto overflow-x-hidden">
                        {isCompanyPositionLoadingOptions ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="size-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">
                              Loading...
                            </span>
                          </div>
                        ) : isCompanyPositionOptionsError ? (
                          <div className="py-2 px-3 text-sm text-destructive">
                            {`Failed to load options. Using defaults.`}
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No position found.</CommandEmpty>
                            <CommandGroup>
                              {isCompanyPositionOptions
                                ?.filter((option) =>
                                  option?.label
                                    ?.toLowerCase()
                                    .includes(positionSearch.toLowerCase())
                                )
                                .map((option) => (
                                  <CommandItem
                                    key={option?.value}
                                    value={option?.label}
                                    onSelect={() => {
                                      field.onChange(option?.value);
                                      setPositionComboboxOpen(false);
                                      setPositionSearch("");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <span className="text-sm flex-1">
                                        {option?.label}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </DropdownMenuContent>
                </DropdownMenu>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* @field(company_focus) */}
          <FormField
            control={control}
            name={`attendees.${index}.company_focus`}
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <FormLabel>{`Company Focus`}</FormLabel>
                <DropdownMenu
                  open={focusComboboxOpen}
                  onOpenChange={setFocusComboboxOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={focusComboboxOpen}
                        className="w-full justify-between py-3.25 px-4 h-auto font-normal"
                        disabled={isSubmitting}
                      >
                        {field?.value && field?.value !== "N/A"
                          ? isCompanyFocusOptions?.find(
                              (option) => option?.value === field?.value
                            )?.label || field?.value
                          : "Select company focus..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="p-0"
                    align="start"
                    style={{
                      width: "var(--radix-dropdown-menu-trigger-width)",
                    }}
                  >
                    <Command
                      shouldFilter={false}
                      className="rounded-lg border-none"
                    >
                      <CommandInput
                        placeholder="Search positions..."
                        value={focusSearch}
                        onValueChange={setFocusSearch}
                      />
                      <CommandList className="max-h-[200px] scrollbar overflow-y-auto overflow-x-hidden">
                        {isCompanyFocusLoadingOptions ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="size-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">
                              Loading...
                            </span>
                          </div>
                        ) : isCompanyFocusOptionsError ? (
                          <div className="py-2 px-3 text-sm text-destructive">
                            {`Failed to load options. Using defaults.`}
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No company focus found.</CommandEmpty>
                            <CommandGroup>
                              {isCompanyFocusOptions
                                ?.filter((option) =>
                                  option?.label
                                    ?.toLowerCase()
                                    .includes(focusSearch.toLowerCase())
                                )
                                .map((option) => (
                                  <CommandItem
                                    key={option?.value}
                                    value={option?.label}
                                    onSelect={() => {
                                      field.onChange(option?.value);
                                      setPositionComboboxOpen(false);
                                      setFocusSearch("");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <span className="text-sm flex-1">
                                        {option?.label}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </DropdownMenuContent>
                </DropdownMenu>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* @field(company_size) */}
          <FormField
            control={control}
            name={`attendees.${index}.company_size`}
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <FormLabel>{`Company Size`}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="py-3 px-4 h-auto w-full">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    align="start"
                    side="top"
                    className="py-0.5 px-0.5"
                  >
                    {isCompanyLoadingOptions ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="size-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">
                          Loading...
                        </span>
                      </div>
                    ) : isCompanyOptionsError ? (
                      <div className="py-2 px-3 text-sm text-destructive">
                        {`Failed to load options. Using defaults.`}
                      </div>
                    ) : isCompanySizeOptions?.length > 0 ? (
                      isCompanySizeOptions?.map((option) => (
                        <SelectItem key={option?.value} value={option?.value}>
                          {option?.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="N/A">N/A</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}
    </div>
  );
}
