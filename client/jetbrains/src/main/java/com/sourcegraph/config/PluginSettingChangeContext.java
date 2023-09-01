package com.sourcegraph.config;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.List;

public class PluginSettingChangeContext {
  @NotNull public final String oldUrl;
  public final boolean oldCodyEnabled;
  public final boolean oldCodyAutocompleteEnabled;
  public final boolean oldCodyDebugEnabled;
  public final boolean oldCodyVerboseDebugEnabled;

  @NotNull public final String newUrl;
  @Nullable public final Integer oldCustomAutocompleteColor;
  public final boolean isDotComAccessTokenChanged;
  public final boolean isEnterpriseAccessTokenChanged;
  public final List<String> oldBlacklistedAutocompleteLanguageIds;

  @Nullable public final String newCustomRequestHeaders;
  public final boolean newCodyEnabled;
  public final boolean newCodyAutocompleteEnabled;
  public final boolean newCodyDebugEnabled;
  public final boolean newCodyVerboseDebugEnabled;
  public final boolean oldIsCustomAutocompleteColorEnabled;
  public final boolean isCustomAutocompleteColorEnabled;
  @Nullable public final Integer customAutocompleteColor;

  public final List<String> newBlacklistedAutocompleteLanguageIds;

  public PluginSettingChangeContext(
      boolean oldCodyEnabled,
      boolean oldCodyAutocompleteEnabled,
      @NotNull String oldUrl,
      boolean oldCodyDebugEnabled,
      boolean oldCodyVerboseDebugEnabled,
      Integer oldCustomAutocompleteColor,
      boolean oldIsCustomAutocompleteColorEnabled,
      List<String> oldBlacklistedAutocompleteLanguageIds,
      @NotNull String newUrl,
      boolean isDotComAccessTokenChanged,
      boolean isEnterpriseAccessTokenChanged,
      @Nullable String newCustomRequestHeaders,
      boolean newCodyEnabled,
      boolean newCodyAutocompleteEnabled,
      boolean newCodyDebugEnabled,
      boolean newCodyVerboseDebugEnabled,
      boolean isCustomAutocompleteColorEnabled,
      @Nullable Integer customAutocompleteColor,
      List<String> newBlacklistedAutocompleteLanguageIds) {
    this.oldCodyEnabled = oldCodyEnabled;
    this.oldCodyAutocompleteEnabled = oldCodyAutocompleteEnabled;
    this.oldUrl = oldUrl;
    this.oldCodyDebugEnabled = oldCodyDebugEnabled;
    this.oldCodyVerboseDebugEnabled = oldCodyVerboseDebugEnabled;
    this.oldBlacklistedAutocompleteLanguageIds = oldBlacklistedAutocompleteLanguageIds;
    this.newUrl = newUrl;
    this.oldCustomAutocompleteColor = oldCustomAutocompleteColor;
    this.isDotComAccessTokenChanged = isDotComAccessTokenChanged;
    this.isEnterpriseAccessTokenChanged = isEnterpriseAccessTokenChanged;
    this.newCustomRequestHeaders = newCustomRequestHeaders;
    this.newCodyEnabled = newCodyEnabled;
    this.newCodyAutocompleteEnabled = newCodyAutocompleteEnabled;
    this.newCodyDebugEnabled = newCodyDebugEnabled;
    this.newCodyVerboseDebugEnabled = newCodyVerboseDebugEnabled;
    this.isCustomAutocompleteColorEnabled = isCustomAutocompleteColorEnabled;
    this.oldIsCustomAutocompleteColorEnabled = oldIsCustomAutocompleteColorEnabled;
    this.customAutocompleteColor = customAutocompleteColor;
    this.newBlacklistedAutocompleteLanguageIds = newBlacklistedAutocompleteLanguageIds;
  }
}
