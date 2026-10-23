<?php
namespace YAgent;
use YAgent\AI\{Config,Gateway,UsageLedger};
use YAgent\Infrastructure\Store;
use YAgent\Memory\{Conversations,Templates};
use YAgent\Agent\{Tasks,Runner,ToolExecutor,Approvals};
if (!defined('ABSPATH')) { exit; }

final class Core
{
    public Store $store;public Config $config;public Settings $settings;public Gateway $gateway;
    public Conversations $conversations;public Templates $templates;public Tasks $tasks;public Runner $runner;
    public ToolExecutor $executor;public Approvals $approvals;public UsageLedger $usage;
    public function __construct()
    {
        $this->store=new Store();$this->config=new Config();$this->settings=new Settings(new Secrets());
        $this->gateway=new Gateway($this->settings,$this->config,$this->store);$this->conversations=new Conversations($this->store);$this->templates=new Templates($this->store);
        $this->tasks=new Tasks($this->store,$this->config,$this->settings,$this->gateway,$this->conversations);$this->runner=new Runner($this->store,$this->config,$this->settings,$this->gateway,$this->conversations);
        $this->executor=new ToolExecutor($this->store);$this->approvals=new Approvals($this->store,$this->executor);$this->usage=new UsageLedger($this->store);
    }
}
