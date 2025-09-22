<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Notifications\Livewire\DatabaseNotifications;
use Filament\Pages\Dashboard;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Enums\Platform;
use Filament\Support\View\Components\ModalComponent;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Str;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class CamPanelProvider extends PanelProvider
{
    public function boot(): void
    {
        $this->preventModalAccidentalClosure();

        Page::stickyFormActions();

        DatabaseNotifications::pollingInterval('1s');
    }

    /**
     * @throws \Exception
     */
    public function panel(Panel $panel): Panel
    {
        $panelName = 'Cam';

        $this->setupDefaultsOn($panel, $panelName);
        $this->setupBrandingOn($panel);
        $this->setupWidgetsOn($panel);
        $this->setupNavigationOn($panel);
        $this->setupPagesOn($panel);
        $this->setupDiscoveriesOn($panel, $panelName);
        $this->setupGlobalSearchOn($panel);
        $this->setupPluginsOn($panel);

        $this->setupMiddlewareOn($panel);

        return $panel;
    }

    /**
     * @throws \Exception
     */
    private function setupDefaultsOn(Panel $panel, string $panelName): void
    {

        $panel
            ->default()
            ->id(Str::lower($panelName))
            ->path('/')
            ->spa()
            ->login()
            ->unsavedChangesAlerts(app()->environment() === 'production')
            ->databaseTransactions()
//            ->databaseNotifications()
            ->readOnlyRelationManagersOnResourceViewPagesByDefault(false)
            ->profile();
    }

    private function setupBrandingOn(Panel $panel): void
    {
        $panel
            ->brandName('cam-parser')
            ->brandLogo(fn () => view('cam.logo'))
            ->colors([
                'primary' => Color::Red,
                'secondary' => Color::Indigo,

            ])
            ->viteTheme([
                'resources/css/filament/theme.css',
                'resources/js/app.js',
            ], 'build')
            ->font('Instrument Sans');
    }

    private function setupPagesOn(Panel $panel): void
    {
        $panel
            ->pages([
                Dashboard::class,
            ]);
    }

    private function setupPluginsOn(Panel $panel): void
    {

        $panel
            ->plugins([

            ]);
    }

    private function setupWidgetsOn(Panel $panel): void
    {
        $panel
            ->widgets([
                Widgets\AccountWidget::class,
                Widgets\FilamentInfoWidget::class,
            ]);
    }

    private function setupDiscoveriesOn(Panel $panel, string $panelName): void
    {
        $panel
            ->discoverResources(
                in: app_path("Filament/$panelName/Resources"),
                for: "App\\Filament\\$panelName\\Resources"
            )
            ->discoverPages(
                in: app_path("Filament/$panelName/Pages"),
                for: "App\\Filament\\$panelName\\Pages"
            )
            ->discoverClusters(
                in: app_path("Filament/$panelName/Clusters"),
                for: "App\\Filament\\$panelName\\Clusters"
            )
            ->discoverWidgets(
                in: app_path("Filament/$panelName/Widgets"),
                for: "App\\Filament\\$panelName\\Widgets"
            );
    }

    private function setupGlobalSearchOn(Panel $panel): void
    {
        $panel
            ->globalSearchKeyBindings(['command+k', 'ctrl+k'])
            ->globalSearchFieldSuffix(fn (): ?string => match (Platform::detect()) {
                Platform::Windows, Platform::Linux => 'CTRL+K',
                Platform::Mac => '⌘K',
                default => null,
            });
    }

    private function setupMiddlewareOn(Panel $panel): void
    {
        $panel
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }

    private function setupNavigationOn(Panel $panel): void
    {
        $panel
            ->sidebarCollapsibleOnDesktop();
    }

    private function preventModalAccidentalClosure(): void
    {
        ModalComponent::closedByClickingAway(false);
    }
}
